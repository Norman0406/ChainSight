export function satsToBtc(value: number): number {
    // one BTC equals so much satoshi
    const BTC = 1e8

    return value / BTC
}

export function shortenBitcoinAddress(address: string): string {
    if (address.length <= 10) {
        return address;
    }

    const firstFive = address.substring(0, 5);
    const lastFive = address.substring(address.length - 5);

    return `${firstFive}...${lastFive}`;
}

export function dynamicSizeFromValue(valueInSatoshi: number, minSize: number, maxSize: number, maxSizeAtBtc: number): number {
    const scalingFactor = maxSize - minSize;
    const valueInBtc = satsToBtc(valueInSatoshi)
    const result = minSize + (valueInBtc / maxSizeAtBtc) * scalingFactor;
    return Math.min(result, maxSize);
}
