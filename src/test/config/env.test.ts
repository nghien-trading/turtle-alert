import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { validateEnv } from "../../config/env";

describe("ENV Validation", () => {
    const originalEnv = process.env;

    beforeAll(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test("validates minimal viable ENV correctly", () => {
        process.env.DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/123";
        process.env.SYMBOLS = "BTC,ETH";
        process.env.TIMEFRAME = "15m";
        process.env.RISK_PERCENT = "2";

        const config = validateEnv();

        expect(config.discordWebhookUrl).toBe("https://discord.com/api/webhooks/123");
        expect(config.symbols).toEqual(["BTC", "ETH"]);
        expect(config.timeframe).toBe("15m");
        expect(config.riskPercent).toBe(2);
    });

    test("throws an error if missing required ENV variables", () => {
        delete process.env.DISCORD_WEBHOOK_URL;
        expect(() => validateEnv()).toThrow("Missing DISCORD_WEBHOOK_URL");
    });

    test("throws an error if RISK_PERCENT is invalid", () => {
        process.env.DISCORD_WEBHOOK_URL = "https://discord.com";
        process.env.SYMBOLS = "BTC";
        process.env.TIMEFRAME = "15m";
        process.env.RISK_PERCENT = "invalid";
        expect(() => validateEnv()).toThrow("Invalid RISK_PERCENT");
    });
});
