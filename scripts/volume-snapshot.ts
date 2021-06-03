import yargs from "yargs";
import fs from "fs";
import * as dotenv from "dotenv";
import { getTradeVolume, getAllUsers, fetchMagicAddress } from "../snapshot-helpers";


dotenv.config();

const snapshotBalances: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/volume-weighted-";

const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
  }).argv;


export async function generateVolumeSnapshot(args: any): Promise<any> {
    const timestamp = args.timestamp;
    const supply = args.supply;
    const snapshotFilePath = args.snapshotFilePath;
    
    console.log(`Generating volume weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    // get all users
    const users: string[] = await getAllUsers(timestamp); 
    
    //get volume per user at the timestamp
    console.log(`Fetching trade volume per user at snapshot...`);
    const tradeVolumes = await getTradeVolume(users, timestamp);
    
    // get total volume
    const totalTradeVolume = tradeVolumes.reduce(function(prev, current){
        return prev + current;
    }, 0);
    console.log(`Complete! Total trade volume: ${totalTradeVolume}!`);

    for(const userIndex in users){
        const user = users[userIndex];
        const userVolume = tradeVolumes[userIndex];
        if(userVolume > 0){
            const airdropAmount = (userVolume / totalTradeVolume) * supply;
            const magicAddress = await fetchMagicAddress(user);
            snapshotBalances.push({proxyWallet: user, magicWallet: magicAddress, amount: airdropAmount });
        }
    }
    if(snapshotBalances.length > 0){
        await writeSnapshot(timestamp, snapshotFilePath, snapshotBalances);
    }
    return snapshotBalances;
}


async function writeSnapshot(timestamp: number, snapshotFilePath: string, snapshotBalances: any) {
    const pathComponents = snapshotFilePath.split("/");
    const dirPath = pathComponents.slice(0, pathComponents.length-1).join("/");

    const snapshotFile = `${snapshotFilePath + timestamp.toString()}.json`;
    !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
    console.log(`Writing snapshot to disk...`);
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshotBalances));
    console.log(`Complete!`);
}

generateVolumeSnapshot(args);