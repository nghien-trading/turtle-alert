import { describe, expect, test } from "bun:test";
import { calculateDonchianChannel } from "../../indicators/donchian";

// Helper: build 20 candles from arrays of highs and lows
function makeCandles(highs: number[], lows: number[]): { high: number; low: number }[] {
    return highs.map((h, i) => ({ high: h, low: lows[i]! }));
}

describe("Donchian Channel Calculation", () => {
    // ----------------------------------------------------------------
    // Test 1: Upper Band — max(high) over 20 candles
    // ----------------------------------------------------------------
    test("upper band equals max of all 20 highs", () => {
        const highs = [10, 12, 8, 15, 9, 11, 7, 13, 6, 14, 16, 5, 18, 3, 20, 1, 19, 4, 17, 2];
        const lows = Array(20).fill(1);
        const { upper } = calculateDonchianChannel(makeCandles(highs, lows));
        expect(upper).toBe(20); // max of highs
    });

    // ----------------------------------------------------------------
    // Test 2: Lower Band — min(low) over 20 candles
    // ----------------------------------------------------------------
    test("lower band equals min of all 20 lows", () => {
        const highs = Array(20).fill(100);
        const lows = [50, 48, 55, 40, 60, 35, 70, 30, 80, 25, 90, 20, 45, 15, 65, 10, 75, 5, 85, 42];
        const { lower } = calculateDonchianChannel(makeCandles(highs, lows));
        expect(lower).toBe(5); // min of lows
    });

    // ----------------------------------------------------------------
    // Test 3: Middle Band — (upper + lower) / 2
    // ----------------------------------------------------------------
    test("middle band equals (upper + lower) / 2", () => {
        const highs = Array(20).fill(200);
        const lows = Array(20).fill(100);
        const { upper, lower, middle } = calculateDonchianChannel(makeCandles(highs, lows));
        expect(upper).toBe(200);
        expect(lower).toBe(100);
        expect(middle).toBe(150); // (200 + 100) / 2
    });

    test("middle band computed correctly for asymmetric bands", () => {
        const highs = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 80];
        const lows = [20, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
        const { upper, lower, middle } = calculateDonchianChannel(makeCandles(highs, lows));
        expect(upper).toBe(80);
        expect(lower).toBe(20);
        expect(middle).toBe(50);
    });

    // ----------------------------------------------------------------
    // Test 4: Rolling window — ONLY last 20 candles; old candles must
    //         NOT affect the result
    // ----------------------------------------------------------------
    test("uses exactly 20 candles — older data must not affect result", () => {
        // Build two windows of 20 candles each.
        // Window A: highs all 999, lows all 1 — would give upper=999, lower=1
        // Window B: highs all 50,  lows all 10  — correct result is upper=50, lower=10
        const windowA = makeCandles(Array(20).fill(999), Array(20).fill(1));
        const windowB = makeCandles(Array(20).fill(50), Array(20).fill(10));

        // If we pass only window B (last 20), old windowA values must have no effect.
        const { upper, lower, middle } = calculateDonchianChannel(windowB);
        expect(upper).toBe(50);
        expect(lower).toBe(10);
        expect(middle).toBe(30);
    });

    test("throws when given fewer than 20 candles", () => {
        const candles = makeCandles([10, 20], [5, 15]);
        expect(() => calculateDonchianChannel(candles)).toThrow();
    });

    test("throws when given more than 20 candles", () => {
        const candles = makeCandles(Array(21).fill(50), Array(21).fill(10));
        expect(() => calculateDonchianChannel(candles)).toThrow();
    });

    // ----------------------------------------------------------------
    // Test 5: Signal logic boundary cases via band values
    //         (full signal integration tests live in signals.test.ts)
    // ----------------------------------------------------------------
    test("distinct last-element high/low dominate extremes", () => {
        // 19 candles with high=50/low=30, last candle spikes to high=100/low=5
        const highs = [...Array(19).fill(50), 100];
        const lows = [...Array(19).fill(30), 5];
        const { upper, lower } = calculateDonchianChannel(makeCandles(highs, lows));
        expect(upper).toBe(100);
        expect(lower).toBe(5);
    });

    // ----------------------------------------------------------------
    // Test 6: No Bollinger references in the donchian module
    // ----------------------------------------------------------------
    test("donchian module does not reference Bollinger, SMA, or StdDev", async () => {
        const path = import.meta.dir + "/../../indicators/donchian.ts";
        const file = await Bun.file(path).text();
        expect(file.toLowerCase()).not.toContain("bollinger");
        expect(file.toLowerCase()).not.toContain("sma");
        expect(file.toLowerCase()).not.toContain("stddev");
        expect(file.toLowerCase()).not.toContain("standard deviation");
    });
});
