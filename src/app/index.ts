import { validateEnv } from "../config/env";
import { sendDiscordAlert } from "../discord/webhook";
import { fetchMeta } from "../hyperliquid/api";
import { calculateDonchianChannel } from "../indicators/donchian";
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

    // We need 21 candles: 20 to compute the Donchian Channel for the previous
    // candle's bands, plus the candle that just closed as the "current" candle.
    if (buffer.length < 21) {
        return; // Need more data
    }

    // prevCandles: the 20 candles before the one that just closed.
    // These determine the Donchian bands at the time of the previous candle.
    const prevCandles = buffer.slice(buffer.length - 21, buffer.length - 1); // 20 items
    const prevCandle = prevCandles[prevCandles.length - 1]!; // the one before the currently closed one
    const currCandle = buffer[buffer.length - 1]!;           // the one that just closed

    // Donchian Channel on the 20-candle window.
    // Uses high/low of each candle — no averaging, no std deviation.
    const { upper, lower, middle } = calculateDonchianChannel(prevCandles);

    const signal = detectSignal({ close: prevCandle.close }, { close: currCandle.close }, lower, upper);
    if (!signal) return;

    // We have a breakout signal!
    const sl = calculateStopLoss(signal, upper, lower);
    const entryPrice = currCandle.close;

    const leverageResult = calculateLeverage(entryPrice, sl, maxLev);
    if (!leverageResult) {
        console.log(`Skipping ${signal} signal for ${coin} due to leverage constraint`);
        return;
    }

    const alertMsg = {
        content: "@everyone", // Mention everyone in the channel
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
                    value: `🟢 **Entry:** ${entryPrice}\n🔴 **Stop Loss:** ${sl}\n📉 **PriceDistance:** ${leverageResult.priceDistance.toFixed(4)}\n📊 **DistancePercent:** ${(leverageResult.distancePercent * 100).toFixed(2)}%`,
                    inline: false
                },
                {
                    name: "Donchian Channel",
                    value: `📈 **UpperBand:** ${upper.toFixed(4)}\n📉 **LowerBand:** ${lower.toFixed(4)}\n➖ **MiddleBand:** ${middle.toFixed(4)}`,
                    inline: true
                },
                {
                    name: "Leverage",
                    value: `⚖️ **MaxLeverage:** ${maxLev}x\n🚀 **OptimalLeverage:** **${leverageResult.leverage}x**`,
                    inline: true
                },
                {
                    name: "Mathematical Formulas Used",
                    value: "```text\nUpperBand = max(high[i]) over last 20 candles\nLowerBand = min(low[i]) over last 20 candles\nDistancePercent = abs(Entry - SL) / Entry\n\nLeverage Limit:\nValid if: DistancePercent < 1 / L\n```",
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    await sendDiscordAlert(config.discordWebhookUrl, alertMsg);
    console.log(`Sent alert for ${coin} - ${signal}`);
}

startApp().catch(err => console.error("Fatal error:", err));
