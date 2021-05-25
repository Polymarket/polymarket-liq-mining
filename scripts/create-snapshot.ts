import { BigNumber } from 'ethers';
import yargs from "yargs";
import { retryWithBackoff } from "promises-tho";
import { useSubscription } from '@apollo/client';
import { User, getAllUsers } from "../snapshot-helpers";

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

const snapshotBalances: { account: string; amount: BigNumber }[] = [];

const DEFAULT_TOKEN_SUPPLY = 1000000;

//Args
const args = yargs.options({
    'timestamp': { type: 'timestamp', demandOption: false, default: Date.now()},
    'token_supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY}
  }).argv;

(async () => {
    //args
    console.log(`timestamp: ${args.timestamp}`);
    console.log(`total supply: ${args.total_supply}`);

    // get all users
    // const users: User[] = await getAllUsers(); 

    // users.forEach(user => 
    //     // console.log(`User: ${user.address}`)
    //     // user.weight = calculateTokenWeight(user.address)
    // );

    // for every user
        // get their transaction points: getTransactionPoints()
        // get their liquidity points: getLiquidityProviderPoints()

    // get total numbers of points

    // for every user
        // airdrop_amount = (user.weight / total_weight ) * token_supply
        // eoaAddress = getMagicLinkAddress()
        // snapshotBalances.push({ account: eoaAddress, amount: airdrop_amount })

    // write snapshotBalances to a json file snapshots/<timestamp>.json. Overwrite the file if it already exists
})()
