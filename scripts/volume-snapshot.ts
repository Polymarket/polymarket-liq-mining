import yargs from "yargs";
import fs from "fs";
import { getTradeVolume, getAllUsers, fetchMagicAddress } from "../snapshot-helpers";

const snapshotBalances: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/volume-weighted-";


const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
  }).argv;


(async () => {
    const timestamp = args.timestamp;
    const supply = args.supply;
    const snapshotFilePath = args.snapshotFilePath;
    
    console.log(`Generating volume weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    // get all users
    const users: string[] = await getAllUsers(timestamp); 

    //get volume per user at the timestamp
    const tradeVolumes = await getTradeVolume(users, timestamp);
    
    // get total volume
    const totalTradeVolume = tradeVolumes.reduce(function(prev, current){
        return prev + current;
    }, 0);

    for(const id in users){
        const user = users[id];
        const userVolume = tradeVolumes[id];
        if(userVolume > 0){
            const airdropAmount = (userVolume / totalTradeVolume) * supply;
            const magicAddress = await fetchMagicAddress(user);
            snapshotBalances.push({proxyWallet: user, magicWallet: magicAddress, amount: airdropAmount });
        }
    }
    if(snapshotBalances.length > 1){
        await writeSnapshot(timestamp, snapshotFilePath, snapshotBalances);
    }
})()


async function writeSnapshot(timestamp: number, snapshotFilePath: string, snapshotBalances: any) {
    const pathComponents = snapshotFilePath.split("/");
    const dirPath = pathComponents.slice(0, pathComponents.length-1).join("/");

    const snapshotFile = `${snapshotFilePath + timestamp.toString()}.json`;
    !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
    console.log(`Writing snapshot to disk...`);
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshotBalances));
    console.log(`Complete!`);
}