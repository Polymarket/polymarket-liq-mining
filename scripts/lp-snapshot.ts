/*TODO: 

Calculate weighted lp value query per trader over Polymarket's entire history.

{ lpAddress: lpPoints, ...}

a liquidity provider's LP points should be calculated as
 1 point per $1 per 1 block of liquidity provided. 
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

export async function generateLpSnapshot(args: any): Promise<any> {
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
            snapshot.push({proxyWallet: user, magicWallet: magicAddress, amount: airdropAmount });
        }
    }
    await writeSnapshot(timestamp, snapshotFilePath, snapshot);
    return snapshot;
}