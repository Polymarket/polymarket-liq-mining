import { getProvider } from "./provider"; 
import { normalizeTimestamp } from "./utils";
import { queryGqlClient } from "./gql_client"; 
import { firstLiquidityAddedQuery, marketResolutionTxnQuery } from "./queries";

export const getCurrentBlockNumber = async (): Promise<number> => {
    const provider = getProvider();
    return provider.getBlockNumber();
}

export const getStartBlock = async (marketAddress: string): Promise<number> => {
    let blockNumber: number;
    const provider = getProvider();
    const txnHash = await getFirstAddedLiquidity(marketAddress);
    if(txnHash != null){
        const txn = await provider.getTransaction(txnHash);
        blockNumber = txn.blockNumber;
    }
    return blockNumber;
}

export async function getEndBlock(marketAddress: string): Promise<number> {
    let blockNumber: number;
    const provider = getProvider();
    const txnHash = await getMarketResolutionTransaction(marketAddress);
    if(txnHash != null){
        const txn = await provider.getTransaction(txnHash);
        blockNumber = txn.blockNumber;
    }
    return blockNumber;
}

async function getFirstAddedLiquidity(marketAddress: string) : Promise<string> {
    const { data } = await queryGqlClient(firstLiquidityAddedQuery, {market: marketAddress});
    const fpmmFundingAdditions = data.fpmmFundingAdditions;
    let liquidityAddTxnHash;

    if(fpmmFundingAdditions.length > 0){
        liquidityAddTxnHash = fpmmFundingAdditions[0].id;
    }
    return liquidityAddTxnHash;
}

async function getMarketResolutionTransaction(marketAddress: string) : Promise<string> {
    const { data } = await queryGqlClient(marketResolutionTxnQuery, {market: marketAddress});
    const resolutionConditions = data.fixedProductMarketMaker.conditions;
    let resolutionHash: string;

    if(resolutionConditions.length > 0){
        resolutionHash = resolutionConditions[0].resolutionHash;
    }
    return resolutionHash;
}


/**
 * Get an estimation of a block number, given a timestamp
 * @param timestamp 
 * @returns 
 */
export async function convertTimestampToBlockNumber(timestamp: number) : Promise<number> {
    const timestampInSeconds = normalizeTimestamp(timestamp);

    const averageBlockTime = 2.1; //polygon avg blocktime
    const lowerLimitStamp = timestampInSeconds;
    const step = 1000;
    
    const provider = getProvider();
    
    //get current block number
    const currentBlockNumber = await provider.getBlockNumber();
	console.log('currentBlockNumber', currentBlockNumber)
    let block = await provider.getBlock(currentBlockNumber)

    let requestsMade = 0;
    
    let blockNumber = currentBlockNumber;

	console.log('block.timestamp', block?.timestamp ?? 0)
    const timestampDiff = block?.timestamp ?? 0 - timestampInSeconds;
    
    //If current block timestamp and given timestamp within 50s of each other, return
    if(timestampDiff < 50){
        return currentBlockNumber;
    }

    while(block.timestamp > timestampInSeconds){
        const decreaseBlocks = (block.timestamp - timestampInSeconds) / averageBlockTime;
        if(decreaseBlocks < 1){
            break
        }
    
        blockNumber -= Math.floor(decreaseBlocks);
        block = await provider.getBlock(blockNumber) 
        requestsMade += 1
    }

    //If we undershoot, walk back up the chain till we reach the lowerLimitStamp
    if(block.timestamp < lowerLimitStamp) {
        while(block.timestamp < lowerLimitStamp){
            blockNumber += step; //step size
            block = await provider.getBlock(blockNumber);
            requestsMade += 1;
        }
    }
    console.log(`Number of requests made to get block number from timestamp: ${requestsMade}`);
    return blockNumber;
}
