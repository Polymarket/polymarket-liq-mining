import { BigNumber, utils, providers } from 'ethers';
import yargs from "yargs";
import fs from "fs";
import { User, getAllUsers, calculatePointsPerUser, getMagicLinkAddress } from "../snapshot-helpers";


const snapshotBalances: { account: string; amount: number }[] = [];

const DEFAULT_TOKEN_SUPPLY = 1000000;
const SNAPSHOT_FILE_NAME = "snapshots_";

//Args
const args = yargs.options({
    'timestamp': { type: 'timestamp', demandOption: false, default: Date.now()},
    'token_supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshot_file_name': { type: 'string', demandOption: false, default: SNAPSHOT_FILE_NAME}
  }).argv;

(async () => {
    const timestamp = args.timestamp;
    const token_supply = args.token_supply;
    const snapshot_file_name = args.snapshot_file_name;

    const provider = new providers.JsonRpcProvider();

    console.log(`Generating token snapshot with timestamp: ${timestamp} and token total supply: ${token_supply} ..`);

    // get all users
    const users: User[] = await getAllUsers(timestamp); 

    //calculate points for each user
    for(let user of users){
        user.points = await calculatePointsPerUser(user.address, timestamp);
    }

    // get total numbers of points
    const total_points: number = users.reduce(function(prev, current){
        return prev + current.points;
    }, 0);

    for(let user of users){
        if(user.points > 0){
            const airdrop_amount = (user.points / total_points) * token_supply;
            console.log(`User ${user.address} receives ${airdrop_amount} tokens`);
            const eoaAddress = await getMagicLinkAddress(user.address);
            snapshotBalances.push({ account: eoaAddress, amount: airdrop_amount });
        }
    }

    const snapshotFile = `${snapshot_file_name + timestamp.toString()}.json`;
    console.log(`Writing snapshot to disk...`);
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshotBalances));
    console.log(`Complete!`);
    
})()
