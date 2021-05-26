import { BigNumber, utils } from 'ethers';
import yargs from "yargs";
import fs from "fs";
import { retryWithBackoff } from "promises-tho";
import { useSubscription } from '@apollo/client';
import { User, getAllUsers, calculatePointsPerUser } from "../snapshot-helpers";

/*
IMPORTANT:
All async calls should be wrapped with `retryWithBackoff` (or a similar function) so if there's an
error with a request, the snapshot won't be wrong. If the request never succeeds, an error should be thrown and
the snapshot discarded.
*/

/*
Add an optional cli argument that enables passing in a timestamp. If a timestamp is not passed in, use the current time.
Add an optional cli argument that enables passing in the amount of tokens to distribute. If not passed in, use a hard coded value

can use yargs for passing in cli args (https://www.npmjs.com/package/yargs)
*/

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
    console.log(`Generating token snapshot with timestamp: ${timestamp} and token total supply: ${token_supply} ..`);

    // get all users
    const users: User[] = await getAllUsers(); 

    // for every user
        // get their transaction points: getTransactionPoints()
        // get their liquidity points: getLiquidityProviderPoints()
    for(let i=0; i< users.length; i++){
        let user = users[i];
        user.points = await calculatePointsPerUser(user.address, timestamp);
    }

    // get total numbers of points
    const total_points: number = users.reduce(function(prev, current){
        return prev + current.points;
    }, 0);

    // for every user
        // airdrop_amount = (user.weight / total_weight ) * token_supply
        // eoaAddress = getMagicLinkAddress()
        // snapshotBalances.push({ account: eoaAddress, amount: airdrop_amount })
    console.log(`Calculating token airdrop amount for users`)
    for(let i=0; i< users.length; i++){
        let user = users[i];

        if(user.points > 0){
            const airdrop_amount = (user.points / total_points) * token_supply;
            console.log(`User ${user.address} receives ${airdrop_amount} tokens`);
            // const eoaAddress = getMagicLinkAddress(user.address);
            const eoaAddress = "0x" + i.toString();
            // snapshotBalances.push({ account: eoaAddress, amount: utils.parseEther(airdrop_amount.toString()) });
            snapshotBalances.push({ account: eoaAddress, amount: airdrop_amount });
        }
    }

    // write snapshotBalances to a json file snapshots/<timestamp>.json. Overwrite the file if it already exists
    console.log(`Writing snapshot to disk...`);
    fs.writeFileSync(`${snapshot_file_name + timestamp.toString()}.json`, JSON.stringify(snapshotBalances));
    console.log(`Complete!`);
})()
