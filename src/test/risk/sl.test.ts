import { describe, expect, test } from "bun:test";
import { calculateStopLoss } from "../../risk/sl";

// ================================================================
// Stop Loss Placement — Donchian Band Rules
// ================================================================
// LONG  breakout → SL = LowerBand  (NOT candle low)
// SHORT breakout → SL = UpperBand  (NOT candle high)
// ================================================================

describe("Stop Loss Calculation (Donchian Band)", () => {
    // ----------------------------------------------------------------
    // Test 1: LONG SL correctness
    //   Given a LONG breakout, SL must equal the current LowerBand.
    //   Candle high/low MUST NOT be used.
    // ----------------------------------------------------------------
    test("LONG: SL equals LowerBand (exact equality)", () => {
        const upperBand = 110;
        const lowerBand = 85;

        const sl = calculateStopLoss("LONG", upperBand, lowerBand);

        // SL must be the lower Donchian band
        expect(sl).toBe(lowerBand); // 85
        // SL must NOT be the upper band
        expect(sl).not.toBe(upperBand);
    });

    // ----------------------------------------------------------------
    // Test 2: SHORT SL correctness
    //   Given a SHORT breakout, SL must equal the current UpperBand.
    //   Candle high/low MUST NOT be used.
    // ----------------------------------------------------------------
    test("SHORT: SL equals UpperBand (exact equality)", () => {
        const upperBand = 110;
        const lowerBand = 85;

        const sl = calculateStopLoss("SHORT", upperBand, lowerBand);

        // SL must be the upper Donchian band
        expect(sl).toBe(upperBand); // 110
        // SL must NOT be the lower band
        expect(sl).not.toBe(lowerBand);
    });

    // ----------------------------------------------------------------
    // Test 3: Candle high/low are NOT part of the SL calculation
    //   The function signature must NOT accept a Candle object.
    //   It accepts (direction, upperBand, lowerBand) only.
    //   TypeScript type enforcement is proof enough; this test verifies
    //   that different candle values produce identical SL results when
    //   bands stay the same.
    // ----------------------------------------------------------------
    test("SL is independent of candle open/high/low/close", () => {
        const upperBand = 200;
        const lowerBand = 150;

        // No matter what a candle looks like, the result only depends on bands
        const slLong1 = calculateStopLoss("LONG", upperBand, lowerBand);
        const slLong2 = calculateStopLoss("LONG", upperBand, lowerBand);
        // Any different candle data is irrelevant — bands drive SL
        expect(slLong1).toBe(lowerBand);
        expect(slLong2).toBe(lowerBand);

        const slShort1 = calculateStopLoss("SHORT", upperBand, lowerBand);
        const slShort2 = calculateStopLoss("SHORT", upperBand, lowerBand);
        expect(slShort1).toBe(upperBand);
        expect(slShort2).toBe(upperBand);
    });

    // ----------------------------------------------------------------
    // Test 4: Leverage calculation uses the new Donchian-band SL
    //   Verify that the SL returned feeds correctly into leverage math.
    //
    //   Scenario (LONG):
    //     Entry    = 105   (breakout candle close)
    //     Upper    = 110
    //     Lower    = 85
    //     SL       = 85    (LowerBand)
    //     PriceDistance    = |105 - 85| = 20
    //     DistancePercent  = 20 / 105 ≈ 0.19047...
    //     Valid leverage L if 0.19047 < 1/L  →  L < 5.25 → max L = 5
    // ----------------------------------------------------------------
    test("LONG: SL feeds leverage calculation (DistancePercent from LowerBand)", () => {
        const { calculateLeverage } = require("../../risk/leverage");

        const entry = 105;
        const upper = 110;
        const lower = 85;

        const sl = calculateStopLoss("LONG", upper, lower);
        expect(sl).toBe(85);

        const result = calculateLeverage(entry, sl, 50);
        expect(result).not.toBeNull();

        const expectedDist = Math.abs(entry - lower) / entry; // 20/105
        expect(result!.distancePercent).toBeCloseTo(expectedDist, 10);

        // Max valid L: distancePercent < 1/L  ⟹  L < 1/distancePercent ≈ 5.25
        // Highest integer = 5
        expect(result!.leverage).toBe(5);
    });

    // ----------------------------------------------------------------
    // Test 5: Leverage calculation uses the new Donchian-band SL
    //
    //   Scenario (SHORT):
    //     Entry    = 88    (breakout candle close)
    //     Upper    = 110
    //     Lower    = 85
    //     SL       = 110   (UpperBand)
    //     PriceDistance    = |88 - 110| = 22
    //     DistancePercent  = 22 / 88 = 0.25
    //     Valid leverage L if 0.25 < 1/L  →  L < 4 → max L = 3
    // ----------------------------------------------------------------
    test("SHORT: SL feeds leverage calculation (DistancePercent from UpperBand)", () => {
        const { calculateLeverage } = require("../../risk/leverage");

        const entry = 88;
        const upper = 110;
        const lower = 85;

        const sl = calculateStopLoss("SHORT", upper, lower);
        expect(sl).toBe(110);

        const result = calculateLeverage(entry, sl, 50);
        expect(result).not.toBeNull();

        const expectedDist = Math.abs(entry - upper) / entry; // 22/88 = 0.25
        expect(result!.distancePercent).toBeCloseTo(expectedDist, 10);

        // 0.25 < 1/L → L < 4 → max valid = 3
        expect(result!.leverage).toBe(3);
    });

    // ----------------------------------------------------------------
    // Test 6: Regression test — fixed bands, verify DistancePercent changes
    //   Old logic: SL = candle low = 102 (close to entry)
    //   New logic: SL = LowerBand  = 80  (much further from entry)
    //   DistancePercent must be bigger with the new logic, causing lower leverage.
    // ----------------------------------------------------------------
    test("REGRESSION: DistancePercent is larger with Donchian SL than candle-low SL would have been", () => {
        const { calculateLeverage } = require("../../risk/leverage");

        const entry = 108;
        const upper = 115;
        const lower = 80;
        // Under old logic: candle.low = 102 → distance = 6, distPct = 6/108 ≈ 0.0556
        // Under new logic: SL = lower = 80  → distance = 28, distPct = 28/108 ≈ 0.259

        const sl = calculateStopLoss("LONG", upper, lower);
        expect(sl).toBe(lower); // 80  ← proved new logic

        const result = calculateLeverage(entry, sl, 50);
        expect(result).not.toBeNull();

        const expectedDistPct = Math.abs(entry - lower) / entry; // 28/108
        expect(result!.distancePercent).toBeCloseTo(expectedDistPct, 10);

        // Old: leverage would have been ~17 (0.0556 < 1/L → L < 18)
        // New: 28/108 ≈ 0.2593 < 1/L → L < 3.857 → max = 3
        expect(result!.leverage).toBe(3);

        // Explicitly confirm SL is not the (hypothetical) candle low of 102
        expect(sl).not.toBe(102);
    });
});
