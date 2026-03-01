export function calculateStdDev(prices: number[], sma: number): number {
    if (prices.length !== 20) {
        throw new Error("Standard Deviation calculation requires exactly 20 prices");
    }
    const varianceSum = prices.reduce((acc, current) => {
        return acc + Math.pow(current - sma, 2);
    }, 0);
    return Math.sqrt(varianceSum / 20);
}
