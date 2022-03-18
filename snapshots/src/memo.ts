import * as fs from "fs";

const MEMOIZED_BASE_PATH = "./memos/";


export interface MemoizedFile {
    marketMakersInMap: { [marketMaker: string]: boolean };
    memoizedUserTokensPerEpoch: { [userAddress: string]: number };
}

export const createMemoFileName = (
    epoch: number,
    tokenSymbol: string,
): string => {
    return `${MEMOIZED_BASE_PATH}epoch-${epoch}-token-${tokenSymbol.toUpperCase()}.json`;
};

export function getMemoFile(
    epoch: number,
    symbol: string,
): MemoizedFile | null {
    try {
        const memoizedMarkets = fs
            .readFileSync(createMemoFileName(epoch, symbol))
            .toString();

        return JSON.parse(memoizedMarkets);
    } catch (error) {
        console.log("get memo file error", error);
        return null;
    }
}

export function setMemoFile(
    symbol: string,
    epoch: number,
    fileMap: MemoizedFile,
): void {
    try {
        fs.writeFileSync(
            createMemoFileName(epoch, symbol),
            JSON.stringify(fileMap),
        );
    } catch (error) {
        console.log("write memo file error", error);
    }
}

