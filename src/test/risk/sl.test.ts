import { describe, expect, test } from "bun:test";
import { calculateStopLoss } from "../../risk/sl";

describe("Stop Loss Calculation", () => {
    test("calculates LONG stop loss correctly", () => {
        // SL = low of signal candle
        const signalCandle = {
            open: 100,
            high: 110,
            low: 90,
            close: 105,
        };
        const sl = calculateStopLoss("LONG", signalCandle);
        expect(sl).toBe(90);
    });

    test("calculates SHORT stop loss correctly", () => {
        // SL = high of signal candle
        const signalCandle = {
            open: 100,
            high: 110,
            low: 90,
            close: 95,
        };
        const sl = calculateStopLoss("SHORT", signalCandle);
        expect(sl).toBe(110);
    });
});
