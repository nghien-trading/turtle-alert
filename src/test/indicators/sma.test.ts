import { describe, expect, test } from "bun:test";
import { calculateSMA } from "../../indicators/sma";

describe("SMA Calculation", () => {
    test("calculates simple moving average correctly", () => {
        const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]; // sum = 390
        const sma = calculateSMA(prices);
        expect(sma).toBe(19.5); // 390 / 20 = 19.5
    });

    test("throws an error if there are not exactly 20 prices (as per strict turtle-trading rules)", () => {
        expect(() => calculateSMA([1, 2, 3])).toThrow();
    });
});
