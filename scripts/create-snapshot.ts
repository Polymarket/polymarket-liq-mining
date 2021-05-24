import { BigNumber } from 'ethers'
import { retryWithBackoff } from "promises-tho";

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

(async () => {
    // get all users

    const points: { account: string; points: number }[] = [];
    // for every user
        // get their transaction points: getTransactionPoints()
        // get their liquidity points: getLiquidityProviderPoints()

    // get total numbers of points

    // for every user
        // airdrop_amount = user_points / total_points
        // eoaAddress = getMagicLinkAddress()
        // snapshotBalances.push({ account: eoaAddress, amount: airdrop_amount })

    // write snapshotBalances to a json file snapshots/<timestamp>.json. Overwrite the file if it already exists
})()
