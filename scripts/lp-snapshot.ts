/*TODO: 

Calculate weighted lp value query per trader over Polymarket's entire history.

{ lpAddress: lpPoints, ...}

a liquidity provider's LP points should be calculated as 1 point per $1 per 1 block of liquidity provided. Liquidity value and quantity supplied should be calculated based on the beginning state of each block. 

Must be using only our subgraph or other open data. Might need to use our amm-maths repo for some helper functions. Should pull in any function you need so that the deliverable is standalone, requiring no private repos. 

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


// (async () => {
//     const timestamp = args.timestamp;
//     const supply = args.supply;
//     const snapshotFilePath = args.snapshotFilePath;
    
//     console.log(`Generating LP weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
//     // get all LPs
     
//     //get liquidity provided by each LP

//     // get total liquidity

//     //calculate pro rata token distribution by LP    

// })()