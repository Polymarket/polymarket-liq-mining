import { getProvider } from "./provider"; 
import { normalizeTimestamp } from "./utils";
 
export const getMarketCreationBlockNumber = async (transactionHash: string): Promise<number> => {
    const provider = await getProvider();
    const txn = await provider.getTransaction(transactionHash);
    return txn.blockNumber;
}


/**
 * Get an estimation of a near block number, given a timestamp
 * @param timestamp 
 * @returns 
 */
export async function convertTimestampToBlockNumber(timestamp: number) {
    const timestampInSeconds = normalizeTimestamp(timestamp);

    const averageBlockTime = 2.1; //polygon avg blocktime
    const lowerLimitStamp = timestampInSeconds;
    const step = 1000; //
    
    const provider = await getProvider();
    
    //get current block number
    const currentBlockNumber = await provider.getBlockNumber();
    let block = await provider.getBlock(currentBlockNumber)
    let requestsMade = 0;
    
    let blockNumber = currentBlockNumber;
    const timestampDiff = block.timestamp - timestampInSeconds;
    
    //If current block timestamp and given timestamp within 100s of each other, return
    if(timestampDiff < 100){
        return currentBlockNumber;
    }

    while(block.timestamp > timestampInSeconds){
        console.log(`Start while...`);
        const decreaseBlocks = (block.timestamp - timestampInSeconds) / averageBlockTime;
        if(decreaseBlocks < 1){
            break
        }
    
        blockNumber -= Math.floor(decreaseBlocks);
        block = await provider.getBlock(blockNumber)
        
        console.log(`Block: ${blockNumber}`);
        console.log(`Block.timestamp: ${block.timestamp}`);
        
        requestsMade += 1
        console.log(`end while...`)
    }
    console.log(`Done!`)

    //If we undershoot, walk back up the chain till we reach the lowerLimitStamp
    if(lowerLimitStamp && block.timestamp < lowerLimitStamp) {
        console.log(`Undershooting block...`)
        while(block.timestamp < lowerLimitStamp){
            blockNumber += step;
            block = await provider.getBlock(blockNumber);
            requestsMade += 1;
            console.log(`In undershooting while, block number: ${blockNumber}`)
        }
    }
    console.log(`Requests made: ${requestsMade}`);
    return blockNumber;
}
