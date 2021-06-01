import yargs from "yargs";
import fs from "fs";
import { getTradeVolume, getAllUsers, fetchMagicAddressFromDB } from "../snapshot-helpers";

const snapshotBalances: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/";


const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
  }).argv;


async function writeSnapshot(timestamp: number, snapshotFilePath: string, snapshotBalances: any) {
    const pathComponents = snapshotFilePath.split("/");
    const dirPath = pathComponents.slice(0, pathComponents.length-1).join("/");

    const snapshotFile = `${snapshotFilePath + timestamp.toString()}.json`;
    !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
    console.log(`Writing snapshot to disk...`);
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshotBalances));
    console.log(`Complete!`);
}

(async () => {
    const timestamp = args.timestamp;
    const supply = args.supply;
    const snapshotFilePath = args.snapshotFilePath;
    
    console.log(`Generating volume weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    // get all users
    const users: string[] = await getAllUsers(timestamp); 
    
    const then = Date.now();
    const tradeVolumes = await getTradeVolume(users, timestamp);
    console.log(`Pulling trade volumes took ${(Date.now() - then)/1000} seconds`);
    
    // get total volume
    const totalTradeVolume = tradeVolumes.reduce(function(prev, current){
        return prev + current;
    }, 0);
    console.log(`Total trade volume : ${totalTradeVolume}`);


    for(const id in users){
        const user = users[id];
        const userVolume = tradeVolumes[id];
        if(userVolume > 0){
            const airdropAmount = (userVolume / totalTradeVolume) * supply;
            
            const magicAddress = await fetchMagicAddressFromDB(user);
            snapshotBalances.push({proxyWallet: user, magicWallet: magicAddress, amount: airdropAmount });
        }
    }

    await writeSnapshot(timestamp, snapshotFilePath, snapshotBalances);
})()
