import { batch } from "promises-tho";
import { getFixedProductMarketMakerQuery } from "./queries";
import { queryGqlClient } from "./gql_client";


/**
 * Calculate liquidity for each LP at a market, at a block
 * @param marketAddress 
 * @param block 
 * @returns 
 */
export const calculateValOfLpPositions = async(marketAddress: string, block: number) : Promise<any> => {
    const fpmm = await getFpmm(marketAddress, block);
    const outcomeTokenPrices = fpmm.outcomeTokenPrices;
    const outcomeTokenAmounts = fpmm.outcomeTokenAmounts;
    const scaledLiquidityParameter = fpmm.scaledLiquidityParameter;
    
    const marketLiquidityAtBlock = {};
    
    if(scaledLiquidityParameter > 0){
        for(const liquidityProvider of fpmm.poolMembers){
            const lpAddress = liquidityProvider.funder.id;
            const lpRatio = parseInt(liquidityProvider.amount) / (scaledLiquidityParameter * Math.pow(10, 6));
            const totalPoolValUsd = ((outcomeTokenAmounts[0] * outcomeTokenPrices[0]) + (outcomeTokenAmounts[1] * outcomeTokenPrices[1])) / Math.pow(10,6);
            const lpPoolValUsd = lpRatio * totalPoolValUsd;
            marketLiquidityAtBlock[lpAddress] = lpPoolValUsd;
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

const calculateValOfLpPositionsWrapper = async(args: {marketAddress: string, block: number}) : Promise<any> => {
    return await calculateValOfLpPositions(args.marketAddress, args.block);
}


const calculateValOfLpPositionsBatched = batch({batchSize: 75}, calculateValOfLpPositionsWrapper);

export const calculateValOfLpPositionsAcrossBlocks = async(marketAddress: string, blocks: number[]) : Promise<any> => {
    console.log(`Calculating value of LP positions for market: ${marketAddress} across ${blocks.length} blocks!`);
    const args: {marketAddress: string, block: number}[] = [];
    for(const block of blocks){
        args.push({marketAddress:marketAddress, block: block});
    }
    return await calculateValOfLpPositionsBatched(args);
}