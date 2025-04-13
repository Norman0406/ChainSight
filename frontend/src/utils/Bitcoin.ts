import { Vout } from "@mempool/mempool.js/lib/interfaces/bitcoin/transactions";

export function getAddressFromVout(vout: Vout): string {
    return vout.scriptpubkey_address
}

export function satsToBtc(value: number): number {
    // one BTC equals so much satoshi
    const ONE_BTC = 1e8

    return value / ONE_BTC
}

export function shortenBitcoinAddress(address: string): string {
    if (address.length <= 10) {
        return address;
    }

    const firstFive = address.substring(0, 5);
    const lastFive = address.substring(address.length - 5);

    return `${firstFive}...${lastFive}`;
}

export function nodeSizeFromSats(valueInSatoshi: number): number {
    return dynamicSizeFromValue(valueInSatoshi, 10, 50, 100);
}

export function edgeSizeFromSats(valueInSatoshi: number): number {
    return dynamicSizeFromValue(valueInSatoshi, 1, 10, 10);
}

export function edgeSizeFromBlockHeightDelta(blockheightDelta: number): number {
    // smaller deltas should yield a bigger size

    const minSize = 1
    const maxSize = 10
    const minSizeAtValue = 30

    const result = (minSizeAtValue / blockheightDelta);
    return Math.min(Math.max(result, minSize), maxSize);
}

export function dynamicSizeFromValue(valueInSatoshi: number, minSize: number, maxSize: number, maxSizeAtBtc: number): number {
    // smaller values yield a smaller size

    const scalingFactor = maxSize - minSize;
    const valueInBtc = satsToBtc(valueInSatoshi)
    const result = minSize + (valueInBtc / maxSizeAtBtc) * scalingFactor;
    return Math.min(result, maxSize);
}
