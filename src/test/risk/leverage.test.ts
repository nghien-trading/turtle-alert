import { describe, expect, test } from "bun:test";
import { calculateLeverage } from "../../risk/leverage";

describe("Leverage Calculation", () => {
    test("calculates leverage correctly according to distance percent", () => {
        // Entry = 100, Stop Loss = 98
        // Distance = 2. DistancePercent = 0.02
        // Constraint: 0.02 < 1 / L -> L < 50
        // If maxLeverage is 100, valid max is 49.
        const res1 = calculateLeverage(100, 98, 100);
        expect(res1?.leverage).toBe(49);

        // Entry = 100, SL = 90
        // Distance = 10. DistancePercent = 0.1
        // Constraint: 0.1 < 1 / L -> L < 10
        // If maxLeverage = 50, valid max is 9.
        const res2 = calculateLeverage(100, 90, 50);
        expect(res2?.leverage).toBe(9);
    });

    test("returns null if no valid leverage", () => {
        // Entry = 100, SL = 50
        // DistancePercent = 0.5. Constraint: 0.5 < 1 / L -> L < 2
        // If maxLeverage is 1, 0.5 < 1 is true, so L=1 is valid.
        const res1 = calculateLeverage(100, 50, 1);
        expect(res1?.leverage).toBe(1);

        // Entry = 100, SL = 10
        // DistancePercent = 0.9. Constraint 0.9 < 1/L -> L < 1.11 -> L=1 valid.
        // Wait, if entry=100, sl=100. distance=0
        const resNo = calculateLeverage(100, 0, 1); // Drop by 100 => distance = 1.0 => 1.0 < 1/L. 1 < 1 is false.
        expect(resNo).toBeNull();
    });
});
