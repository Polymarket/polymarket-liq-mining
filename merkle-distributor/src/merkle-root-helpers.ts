import * as fs from "fs";

export async function getMerkleRoot(filePath: string, symbol: string, epoch: number): Promise<string | undefined> {
    const merkleInfo = fs.readFileSync(`${filePath}epoch${epoch}-token${symbol}-merkle-info.json`).toString();
    const merkleRoot = JSON.parse(merkleInfo).merkleRoot;
    console.log({merkleRoot});
    return merkleRoot;
}
