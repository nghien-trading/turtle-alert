import { describe, expect, test } from "bun:test";
import { calculateStdDev } from "../../indicators/stddev";

describe("Standard Deviation Calculation", () => {
    test("calculates standard deviation correctly", () => {
        // Simple case: all identical prices have 0 std dev
        const identical = Array(20).fill(10);
        expect(calculateStdDev(identical, 10)).toBe(0);

        // Sequence of prices
        const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        // SMA = 10.5
        // Variance = sum( (x - 10.5)^2 ) / 20 = 33.25
        // StdDev = sqrt(33.25) = ~5.76628
        const stdDev = calculateStdDev(prices, 10.5);
        expect(stdDev).toBeCloseTo(5.766281297, 6);
    });

    test("throws an error if not 20 items", () => {
        expect(() => calculateStdDev([1, 2, 3], 2)).toThrow();
    });
});
