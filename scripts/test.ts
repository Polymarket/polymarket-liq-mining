import yargs from "yargs";
import fs from "fs";
import { User, getAllUsers, calculatePointsPerUser, getMagicLinkAddress } from "../snapshot-helpers";


const snapshotBalances: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/";

//Args
const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
  }).argv;


async function writeSnapshot(timestamp: number, snapshotFilePath: string, snapshotBalances: any) {
    
    const pathComponents = snapshotFilePath.split("/");
    const dirPath = pathComponents.slice(0, pathComponents.length -1).join("/");

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
    
    console.log(`Generating token snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    // get all users
    // const users: User[] = await getAllUsers(timestamp); 
    const users: User[] = [{address: "0x04b577f404dbc19fd737c3c1758a2871b8c087b9"}, {address: "0x051b61b3e02b1a07cd97d1b019f1604687e2acb0"}];

    //calculate points for each user
    for(const user of users){
        user.points = await calculatePointsPerUser(user.address, timestamp);
    }

    // get total numbers of points
    const total_points: number = users.reduce(function(prev, current){
        return prev + current.points;
    }, 0);

    for(const user of users){
        if(user.points > 0){
            const airdropAmount = (user.points / total_points) * supply;
            const magicAddress = await getMagicLinkAddress(user.address);
            snapshotBalances.push({proxyWallet: user.address, magicWallet: magicAddress, amount: airdropAmount });
        }
    }
    await writeSnapshot(timestamp, snapshotFilePath, snapshotBalances);
})()
