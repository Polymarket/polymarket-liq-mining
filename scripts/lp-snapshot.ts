/*TODO: 

Calculate weighted lp value query per trader over Polymarket's entire history.

{ lpAddress: lpPoints, ...}

a liquidity provider's LP points should be calculated as
 1 point per $1 per 1 block of liquidity provided. 


*/

import { getMarketCreationBlockNumber, convertTimestampToBlockNumber } from "../snapshot-helpers/block_numbers";
import { fetchMagicAddress, getAllMarkets, Market } from "../snapshot-helpers";


const snapshot: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

export async function generateLpSnapshot(timestamp: number, supply: number): Promise<any> {
    console.log(`Generating lp weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    const lpPointsCache = {};

    // get all markets in Poly history
    const markets: Market[] = await getAllMarkets(timestamp);
    //const tradeVolumes = await getTradeVolume(users, timestamp);
    const endBlock = await convertTimestampToBlockNumber(timestamp);

    //For each market, calculate liquidity at each block till endBlock
    for(const market of markets){
        const startBlock = await getMarketCreationBlockNumber(market.creationTransactionHash); 

        for(let block=startBlock; block <= endBlock; block++){
            //fpmm.ts helper: 
            //function that takes MARKET address, block, calcs lp state and returns a
            //mapping of funder to liquidity provided at market and block
            
            // const cashProvidedPerLP = await getLiquidityStateForMarketAtBlock(market, block);
            const cashProvidedPerLP = {"userA": 100, "userB": 200};
            for(const funder of Object.keys(cashProvidedPerLP)){
                if(lpPointsCache[funder] == null){
                    lpPointsCache[funder] = 0;
                }
                
                lpPointsCache[funder] = lpPointsCache[funder] + cashProvidedPerLP[funder];
            }
        }
    }

    //get total liquidity
    const allLiquidity: number[] = Object.values(lpPointsCache);
    const totalLiquidity = allLiquidity.reduce(function(prev, current){
        return prev + current;
    }, 0);
    console.log(`Total liquidity: ${totalLiquidity}!`);

    //Populate snapshot
    for(const funder of Object.keys(lpPointsCache)){
        
        //total liquidity points for funder across blocks
        const funderLiquidity = lpPointsCache[funder];

        const airdropAmount = (funderLiquidity / totalLiquidity) * supply;
        // const magicAddress = await fetchMagicAddress(funder);
        const magicAddress = "xyz"
        snapshot.push({proxyWallet: funder, magicWallet: magicAddress, amount: airdropAmount });
    }

    return snapshot;
}