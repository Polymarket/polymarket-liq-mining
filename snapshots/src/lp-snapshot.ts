import { fetchMagicAddress, getAllMarkets, calculateLiquidityAcrossBlocks, getMarketLiquidityAddBlockNumber as getStartBlock, convertTimestampToBlockNumber } from "../src";


/**
 * Generate a lp weighted token snapshot
 * @param timestamp
 * @param supply 
 * @returns 
 */
export async function generateLpSnapshot(timestamp: number, supply: number, blockSampleSize: number): Promise<any> {
    console.log(`Generating lp weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    const snapshot: { proxyWallet: string, magicWallet: string; amount: number }[] = [];
    const lpPointsCache = {};

    // get all markets pre snapshot
    const markets: string[] = await getAllMarkets(timestamp);

    const endBlock = await convertTimestampToBlockNumber(timestamp);
    
    //For each market, calculate liquidity from startBlock till endBlock, every blockSampleSize
    for(const market of markets){
        const startBlock = await getStartBlock(market);

        //Ensure that the market occured within the blocks being checked
        if(startBlock != null && endBlock > startBlock){
            const blocks: number[] = [];
            for(let block = startBlock; block <= endBlock; block+=blockSampleSize){
                blocks.push(block);
            }

            //get liquidity state across many blocks for a market
            const liquidityAcrossBlocks = await calculateLiquidityAcrossBlocks(market, blocks);

            for(const liquidityAtBlock of liquidityAcrossBlocks){
                for(const liquidityProvider of Object.keys(liquidityAtBlock)){
                    if(lpPointsCache[liquidityProvider] == null){
                        lpPointsCache[liquidityProvider] = 0;
                    }
                    lpPointsCache[liquidityProvider] = lpPointsCache[liquidityProvider] + liquidityAtBlock[liquidityProvider];
                }
            }
        }
    }
    
    //get total liquidity points
    const allLiquidity: number[] = Object.values(lpPointsCache);
    const totalLiquidityPoints = allLiquidity.reduce(function(prev, current){
        return prev + current;
    }, 0);
    
    //Populate snapshot
    for(const liquidityProvider of Object.keys(lpPointsCache)){
        const liquidityPointsPerLp = lpPointsCache[liquidityProvider];
        const airdropAmount = ( liquidityPointsPerLp / totalLiquidityPoints ) * supply;
        const magicAddress = await fetchMagicAddress(liquidityProvider);
        
        snapshot.push({ proxyWallet: liquidityProvider, 
                        magicWallet: magicAddress, 
                        amount: airdropAmount
        });
    }
    return snapshot;
}