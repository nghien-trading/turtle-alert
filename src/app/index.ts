import { validateEnv } from "../config/env";
import { sendDiscordAlert } from "../discord/webhook";
import { fetchMeta } from "../hyperliquid/api";
import { calculateBollingerBands } from "../indicators/bb";
import { calculateLeverage } from "../risk/leverage";
import { calculateStopLoss, type Candle } from "../risk/sl";
import { detectSignal } from "../signals/signals";

// Global state for simplicity, as per "minimal" requirement
const candleBuffer: Record<string, Candle[]> = {};
let currentCandle: Record<string, Candle & { t: number }> = {};
let ws: WebSocket;

async function startApp() {
    console.log("Starting Turtle Trading Alerting Service...");
    const config = validateEnv();

    const allMeta = await fetchMeta();
    const maxLeverages: Record<string, number> = {};
    for (const sym of config.symbols) {
        const meta = allMeta.find(m => m.name === sym);
        maxLeverages[sym] = meta ? meta.maxLeverage : 1; // fallback to 1x
        candleBuffer[sym] = [];
    }

    const discordMsg = {
        embeds: [{
            title: "🐢 Turtle Trading Alerting Service Started 🐢",
            color: 0x00FFFF, // Cyan-ish color
            fields: [
                {
                    name: "Monitoring Symbols",
                    value: `**${config.symbols.join(", ")}**`,
                    inline: false
                },
                {
                    name: "Configuration",
                    value: `⏱️ **Timeframe:** ${config.timeframe}\n💰 **Risk:** ${config.riskPercent}%`,
                    inline: true
                },
                {
                    name: "Max Leverage Configured",
                    value: Object.entries(maxLeverages).map(([k, v]) => `**${k}:** ${v}x`).join("\n"),
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    console.log("=================================================");
    console.log("🐢 SERICE IS UP && RUNNING 🐢");
    console.log(`⏱️  Timeframe: ${config.timeframe}`);
    console.log(`💰 Risk: ${config.riskPercent}%`);
    console.log(`📈 Symbols: ${config.symbols.join(", ")}`);
    console.log("=================================================");

    await sendDiscordAlert(config.discordWebhookUrl, discordMsg);

    connectWs(config, maxLeverages);
}

function connectWs(config: ReturnType<typeof validateEnv>, maxLeverages: Record<string, number>) {
    ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

    ws.onopen = () => {
        console.log("WebSocket connected.");
        for (const sym of config.symbols) {
            ws.send(JSON.stringify({
                method: "subscribe",
                subscription: { type: "candle", coin: sym, interval: config.timeframe }
            }));
        }
    };

    ws.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data.toString());
            if (data.channel === "candle" && data.data) {
                const coin = data.data.s;
                const c = data.data; // { t, T, s, i, o, c, h, l, v }
                const newCandle = {
                    open: parseFloat(c.o),
                    high: parseFloat(c.h),
                    low: parseFloat(c.l),
                    close: parseFloat(c.c),
                    t: c.t
                };

                const active = currentCandle[coin];

                // If we see a new timestamp 't', the previous candle is officially closed.
                if (active && active.t < newCandle.t) {
                    console.log(event.data);
                    await handleCandleClose(coin, active, config, maxLeverages[coin] || 1);
                    currentCandle[coin] = newCandle;
                } else {
                    currentCandle[coin] = newCandle;
                }
            }
        } catch (err) {
            console.error("Error processing ws message:", err);
        }
    };

    ws.onclose = () => {
        console.warn("WebSocket closed. Reconnecting in 5 seconds...");
        setTimeout(() => connectWs(config, maxLeverages), 5000);
    };

    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
    };
}

async function handleCandleClose(coin: string, closedCandle: Candle, config: ReturnType<typeof validateEnv>, maxLev: number) {
    const buffer = candleBuffer[coin];
    if (!buffer) return;

    buffer.push(closedCandle);
    if (buffer.length > 21) {
        buffer.shift();
    }

    // We need exactly 21 candles to have a "previous" candle and 20 closes to calculate BB for the previous candle.
    // Actually wait: The BB is calculated on the last 20 closes.
    // Signal condition: "Previous candle close < LowerBand"
    // "Current candle close returns inside band"
    // So we need 20 candles to calculate the BB of the PREVIOUS candle.
    // Let's use the 20 candles BEFORE the current closed candle to determine the bands for the current closed candle.
    if (buffer.length < 21) {
        return; // Need more data
    }

    const prevCandles = buffer.slice(buffer.length - 21, buffer.length - 1);
    const prevCandle = prevCandles[prevCandles.length - 1]; // the one before the currently closed one
    const currCandle = buffer[buffer.length - 1]; // the one that just closed

    if (!prevCandle || !currCandle) return;

    const pricesForBB = prevCandles.map(c => c.close);
    const { sma, upper, lower } = calculateBollingerBands(pricesForBB);

    const signal = detectSignal({ close: prevCandle.close }, { close: currCandle.close }, lower, upper);
    if (!signal) return;

    // We have a signal!
    const sl = calculateStopLoss(signal, currCandle);
    const entryPrice = currCandle.close;

    const leverageResult = calculateLeverage(entryPrice, sl, maxLev);
    if (!leverageResult) {
        console.log(`Skipping ${signal} signal for ${coin} due to leverage constraint`);
        return;
    }

    const alertMsg = {
        embeds: [{
            title: "🚨 Turtle Signal Detected 🚨",
            color: signal === "LONG" ? 0x00FF00 : 0xFF0000,
            fields: [
                {
                    name: "Symbol / Direction",
                    value: `**${coin}** | **${signal}**`,
                    inline: false
                },
                {
                    name: "Trade Setup",
                    value: `🟢 **Entry:** ${entryPrice}\n🔴 **Stop Loss:** ${sl}\n📉 **Distance:** ${leverageResult.priceDistance.toFixed(4)} (${(leverageResult.distancePercent * 100).toFixed(2)}%)`,
                    inline: false
                },
                {
                    name: "Leverage Details",
                    value: `⚖️ **Max Allowed:** ${maxLev}x\n🚀 **Selected:** **${leverageResult.leverage}x**`,
                    inline: false
                },
                {
                    name: "Indicators at Signal",
                    value: `📊 **SMA:** ${sma.toFixed(4)}\n📈 **Upper BB:** ${upper.toFixed(4)}\n📉 **Lower BB:** ${lower.toFixed(4)}`,
                    inline: false
                },
                {
                    name: "Mathematical Formulas Used",
                    value: "```text\nBollinger Bands:\nSMA = (sum of last 20 closes) / 20\nStdDev = sqrt(sum((close[i] - SMA)^2) / 20)\nUpperBand = SMA + 2 * StdDev\nLowerBand = SMA - 2 * StdDev\n\nLeverage Limit:\nPriceDist = abs(Entry - SL)\nDist% = PriceDist / Entry\nValid if: Dist% < 1 / L\n```",
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    // sendDiscordAlert has been updated to accept `object` types for rich embeds under `src/discord/webhook.ts`
    await sendDiscordAlert(config.discordWebhookUrl, alertMsg as any);
    console.log(`Sent alert for ${coin} - ${signal}`);
}

startApp().catch(err => console.error("Fatal error:", err));
