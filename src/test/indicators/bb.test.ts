import { describe, expect, test } from "bun:test";
import { calculateBollingerBands } from "../../indicators/bb";

describe("Bollinger Bands Calculation", () => {
    test("calculates Bollinger Bands correctly", () => {
        const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        // SMA = 10.5, StdDev = ~5.766
        const { sma, upper, lower } = calculateBollingerBands(prices);

        expect(sma).toBe(10.5);
        expect(upper).toBeCloseTo(10.5 + 2 * 5.766281297, 5); // 22.03256
        expect(lower).toBeCloseTo(10.5 - 2 * 5.766281297, 5); // -1.03256
    });
});
