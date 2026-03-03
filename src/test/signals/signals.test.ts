import { describe, expect, test } from "bun:test";
import { detectSignal } from "../../signals/signals";

describe("Signal Detection — Donchian Breakout", () => {
    // ----------------------------------------------------------------
    // LONG breakout:
    //   prevClose <= prevUpperBand  AND  currClose > currUpperBand
    // ----------------------------------------------------------------
    test("detects LONG breakout signal correctly", () => {
        const lowerBand = 100;
        const upperBand = 200;

        // Core case: previous close ON the upper band — exactly at boundary
        expect(detectSignal({ close: 200 }, { close: 201 }, lowerBand, upperBand)).toBe("LONG");

        // Core case: previous close strictly below upper band
        expect(detectSignal({ close: 195 }, { close: 205 }, lowerBand, upperBand)).toBe("LONG");

        // Boundary: previous close == upperBand, current barely breaks above
        expect(detectSignal({ close: 200 }, { close: 200.01 }, lowerBand, upperBand)).toBe("LONG");

        // Negative: current close does NOT exceed upper band
        expect(detectSignal({ close: 195 }, { close: 200 }, lowerBand, upperBand)).toBeNull();

        // Negative: current close exactly equals upper band (not a breakout)
        expect(detectSignal({ close: 190 }, { close: 200 }, lowerBand, upperBand)).toBeNull();

        // Negative: previous close was ABOVE upper band (was already broken out)
        expect(detectSignal({ close: 201 }, { close: 205 }, lowerBand, upperBand)).toBeNull();
    });

    // ----------------------------------------------------------------
    // SHORT breakout:
    //   prevClose >= prevLowerBand  AND  currClose < currLowerBand
    // ----------------------------------------------------------------
    test("detects SHORT breakout signal correctly", () => {
        const lowerBand = 100;
        const upperBand = 200;

        // Core case: previous close ON the lower band — exactly at boundary
        expect(detectSignal({ close: 100 }, { close: 99 }, lowerBand, upperBand)).toBe("SHORT");

        // Core case: previous close strictly above lower band
        expect(detectSignal({ close: 105 }, { close: 95 }, lowerBand, upperBand)).toBe("SHORT");

        // Boundary: previous close == lowerBand, current barely breaks below
        expect(detectSignal({ close: 100 }, { close: 99.99 }, lowerBand, upperBand)).toBe("SHORT");

        // Negative: current close does NOT break below lower band
        expect(detectSignal({ close: 105 }, { close: 100 }, lowerBand, upperBand)).toBeNull();

        // Negative: current close exactly equals lower band (not a breakout)
        expect(detectSignal({ close: 110 }, { close: 100 }, lowerBand, upperBand)).toBeNull();

        // Negative: previous close was BELOW lower band (was already broken out)
        expect(detectSignal({ close: 99 }, { close: 95 }, lowerBand, upperBand)).toBeNull();
    });

    test("returns null when neither breakout condition is met", () => {
        // Mid-channel — no signal
        expect(detectSignal({ close: 150 }, { close: 155 }, 100, 200)).toBeNull();
    });
});
