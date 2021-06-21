import * as fs from "fs";

export function normalizeTimestamp(timestamp: number) : number {
    return Math.floor(timestamp / 1000);
}

export async function writeSnapshot(fileName: string, snapshotFilePath: string, snapshot: any) {
    if(snapshot.length > 0){
        const pathComponents = snapshotFilePath.split("/");
        const dirPath = pathComponents.slice(0, pathComponents.length-1).join("/");
        !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
        console.log(`Writing snapshot to disk...`);
        fs.writeFileSync(fileName, JSON.stringify(snapshot));
        console.log(`Complete!`);
    }
}