/*TODO: 

Calculate weighted lp value query per trader over Polymarket's entire history.

{ lpAddress: lpPoints, ...}

a liquidity provider's LP points should be calculated as
 1 point per $1 per 1 block of liquidity provided. 

calcing liquidity snapshot(total liquidity($) across all markets):
    total lp additions <= snapshot 
    - 
    total lp removals <= snapshot

Algorithm:
    * Get all LPs addresses: easy to do with subgraph
    * For each lp, find startLpBlock, by fetching the earliest LP addition txn on the subgraph, 
and getting the block number from that
    * endBlock is the snapshot timestamp, converted to the closest block number, can be found with a binary search(but can be node intensive)
    * For each block in range(startLpBlock, endBlock),
    *   convert the block to a timestamp:
    *   get liquidity snapshot for that lp and timestamp
    *   update a mapping of lp to points accumulated 


#pseudocode
lps: string[] = await getAllLps() //very doable with subgraph
for lp in lps:
    # get start block, get endBlock
    # will require pretty costly hits to the subgraph and node
    # startBlock : earliest lp add txn by lp(subgraph), then fetch the block and block number
    # from the txn hash
    # endBlock: there's a way to find the endBlock with a binary search, given a timestamp
    #           but it's costly, need multiple node hits

    for block in range(startBlock, endBlock+1):
        timestamp = node.getBlock(block).timestamp

        #query subgraph for total liquidity at timestamp



 



Liquidity value and quantity supplied should be calculated based on the
 beginning state of each block. 

Must be using only our subgraph or other open data. 
Might need to use our amm-maths repo for some helper functions.
Should pull in any function you need so that the deliverable is standalone, requiring no private repos. 

*/

// import yargs from "yargs";

// const snapshot: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

// const DEFAULT_TOKEN_SUPPLY = 1000000;
// const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/lp-weighted-";


// const args = yargs.options({
//     'timestamp': { type: 'number', demandOption: false, default: Date.now()},
//     'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
//     'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
//   }).argv;


const snapshot: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

// export async function generateLpSnapshot(args: any): Promise<any> {
//     const timestamp = args.timestamp;
//     const supply = args.supply;
//     const snapshotFilePath = args.snapshotFilePath;
    
//     console.log(`Generating volume weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
//     // get all users
//     const users: string[] = await getAllUsers(timestamp); 
    
//     //get volume per user at the timestamp
//     console.log(`Fetching trade volume per user at snapshot...`);
//     const tradeVolumes = await getTradeVolume(users, timestamp);
    
//     // get total volume
//     const totalTradeVolume = tradeVolumes.reduce(function(prev, current){
//         return prev + current;
//     }, 0);
//     console.log(`Complete! Total trade volume: ${totalTradeVolume}!`);

//     for(const userIndex in users){
//         const user = users[userIndex];
//         const userVolume = tradeVolumes[userIndex];
//         if(userVolume > 0){
//             const airdropAmount = (userVolume / totalTradeVolume) * supply;
//             const magicAddress = await fetchMagicAddress(user);
//             snapshot.push({proxyWallet: user, magicWallet: magicAddress, amount: airdropAmount });
//         }
//     }
//     await writeSnapshot(timestamp, snapshotFilePath, snapshot);
//     return snapshot;
// }