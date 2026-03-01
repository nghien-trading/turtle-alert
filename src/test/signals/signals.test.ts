import { describe, expect, test } from "bun:test";
import { detectSignal } from "../../signals/signals";

describe("Signal Detection", () => {
    test("detects LONG signal correctly", () => {
        const lowerBand = 100;
        const upperBand = 200;

        // Previous candle close < LowerBand
        // Current candle close returns inside band
        const signal = detectSignal({ close: 99 }, { close: 105 }, lowerBand, upperBand);
        expect(signal).toBe("LONG");

        // Negative test: didn't return inside
        expect(detectSignal({ close: 99 }, { close: 98 }, lowerBand, upperBand)).toBeNull();

        // Negative test: previous wasn't lower
        expect(detectSignal({ close: 101 }, { close: 105 }, lowerBand, upperBand)).toBeNull();
    });

    test("detects SHORT signal correctly", () => {
        const lowerBand = 100;
        const upperBand = 200;

        const signal = detectSignal({ close: 201 }, { close: 195 }, lowerBand, upperBand);
        expect(signal).toBe("SHORT");

        // Negative test: didn't return inside
        expect(detectSignal({ close: 201 }, { close: 205 }, lowerBand, upperBand)).toBeNull();

        // Negative test: previous wasn't higher
        expect(detectSignal({ close: 199 }, { close: 195 }, lowerBand, upperBand)).toBeNull();
    });
});
