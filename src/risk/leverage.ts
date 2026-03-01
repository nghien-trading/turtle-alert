export interface LeverageResult {
    leverage: number;
    distancePercent: number;
    priceDistance: number;
}

export function calculateLeverage(entryPrice: number, stopLoss: number, maxLeverage: number): LeverageResult | null {
    const priceDistance = Math.abs(entryPrice - stopLoss);
    const distancePercent = priceDistance / entryPrice;

    let selectedLeverage: number | null = null;

    // Algorithm: for L = 1 to maxLeverage. Valid if distancePercent < 1 / L
    for (let l = 1; l <= maxLeverage; l++) {
        if (distancePercent < (1 / l)) {
            selectedLeverage = l;
        } else {
            // Once it exceeds the threshold, higher leverages will definitely fail too
            break;
        }
    }

    if (selectedLeverage === null) return null;

    return {
        leverage: selectedLeverage,
        distancePercent,
        priceDistance
    };
}
