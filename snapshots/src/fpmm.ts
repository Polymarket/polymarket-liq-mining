import { batch } from "promises-tho";
import { getFixedProductMarketMakerQuery } from "./queries";
import { queryGqlClient } from "./gql_client";


/**
 * Calculate liquidity for each LP at a market, at a block
 * @param marketAddress 
 * @param block 
 * @returns 
 */
export const calculateLiquidityPoints = async(marketAddress: string, block: number) : Promise<any> => {
    const fpmm = await getFpmm(marketAddress, block);
    const outcomeTokenPrices = fpmm.outcomeTokenPrices;
    const outcomeTokenAmounts = fpmm.outcomeTokenAmounts;
    const scaledLiquidityParameter = fpmm.scaledLiquidityParameter;
    
    const marketLiquidityAtBlock = {};
    
    if(scaledLiquidityParameter > 0){
        for(const liquidityProvider of fpmm.poolMembers){
            const lpAddress = liquidityProvider.funder.id;
            const lpRatio = parseInt(liquidityProvider.amount) /
                            (scaledLiquidityParameter * Math.pow(10, 6));
            
            const valueOfLpLiquidity = 
                //pro rata share of LP's liquidity for 1 side of outcome shares
                ((lpRatio * outcomeTokenAmounts[0] * outcomeTokenPrices[0]) / Math.pow(10,6));
                + 
                //pro rata share of LP's liquidity for the other side of outcome
                ((lpRatio * outcomeTokenAmounts[1] * outcomeTokenPrices[1]) / Math.pow(10,6));
            
            marketLiquidityAtBlock[lpAddress] = valueOfLpLiquidity;
        }
    }
    return marketLiquidityAtBlock;
}

/**
 * Given a market and a block, fetch FPMM details as they existed at that block
 * @param marketAddress 
 * @param block 
 */
export const getFpmm = async (marketAddress: string, block: number) : Promise<any> => {
    const { data } = await queryGqlClient(getFixedProductMarketMakerQuery, 
        {market: marketAddress, block: block}
    );
    return data.fixedProductMarketMaker;
}

const calculateLiquidityPointsWrapper = async(args: {marketAddress: string, block: number}) : Promise<any> => {
    return await calculateLiquidityPoints(args.marketAddress, args.block);
}


const calculateLiquidityPointsBatched = batch({batchSize: 75}, calculateLiquidityPointsWrapper);

export const calculateLiquidityAcrossBlocks = async(marketAddress: string, blocks: number[]) : Promise<any> => {
    console.log(`Calculating liquidity for market: ${marketAddress} across ${blocks.length} blocks!`);
    const args: {marketAddress: string, block: number}[] = [];
    for(const block of blocks){
        args.push({marketAddress:marketAddress, block: block});
    }
    const liquidityPointsList = await calculateLiquidityPointsBatched(args);
    return liquidityPointsList;
}