/**
 * Application Configuration defined by environment variables.
 * 
 * Required Environment Variables:
 * 
 * @property DISCORD_WEBHOOK_URL
 *   - Description: The full Discord webhook URL where trading signals will be sent.
 *   - Sample: https://discord.com/api/webhooks/123456789/abcdefghijk
 * 
 * @property SYMBOLS
 *   - Description: A comma-separated list of Hyperliquid ticker symbols to monitor.
 *   - Note: Do NOT include spaces between commas.
 *   - Sample: BTC,ETH,SOL,DOGE
 * 
 * @property TIMEFRAME
 *   - Description: The candlestick interval/timeframe to subscribe to via WebSockets.
 *   - Note: Must be a valid Hyperliquid timeframe (e.g., 1m, 5m, 15m, 1h, 4h, 1d).
 *   - Sample: 15m
 * 
 * @property RISK_PERCENT
 *   - Description: The percentage of total account equity to risk per trade.
 *   - Note: Used conceptually here to determine the maximum loss allowance for leverage limits.
 *   - Sample: 2 (represents 2%)
 * 
 * Example .env file:
 * ==========================================
 * DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/12345/abcdef
 * SYMBOLS=BTC,ETH,SOL
 * TIMEFRAME=15m
 * RISK_PERCENT=2
 * ==========================================
 */
export interface AppConfig {
    discordWebhookUrl: string;
    symbols: string[];
    timeframe: string;
    riskPercent: number;
}

export function validateEnv(): AppConfig {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL");

    const symbolsStr = process.env.SYMBOLS;
    if (!symbolsStr) throw new Error("Missing SYMBOLS");
    const symbols = symbolsStr.split(",").map(s => s.trim()).filter(s => s.length > 0);
    if (symbols.length === 0) throw new Error("SYMBOLS cannot be empty");

    const timeframe = process.env.TIMEFRAME;
    if (!timeframe) throw new Error("Missing TIMEFRAME");

    const riskPercentStr = process.env.RISK_PERCENT;
    if (!riskPercentStr) throw new Error("Missing RISK_PERCENT");

    const riskPercent = parseFloat(riskPercentStr);
    if (isNaN(riskPercent) || riskPercent <= 0) {
        throw new Error("Invalid RISK_PERCENT");
    }

    return {
        discordWebhookUrl: webhookUrl,
        symbols,
        timeframe,
        riskPercent
    };
}
