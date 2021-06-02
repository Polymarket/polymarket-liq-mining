import { batch } from "promises-tho";
import { queryGqlClient } from "./client";
import { getTradeVolumePerUserQuery} from "./queries"


const VOLUME_SCALE_FACTOR = Math.pow(10, 6);

let TS = 0;

/**
 * Calculates total trade volume for an address, given a timestamp snapshot
 * 
 * @param addresses 
 * @param timestamp 
 * @returns 
 */
const getTradeVolumePerUser = async (address: string, timestamp: number) : Promise<number> => {
    let lastId = "";
    let tradeVolume = 0;
    const search = true;
    while(search) {
        const { data } = await queryGqlClient(getTradeVolumePerUserQuery, 
            {lastId: lastId, user: address, timestamp: `${timestamp}`}
        );

        if(data.transactions.length == 0){
            break;
        }

        for(const txn of data.transactions){
            tradeVolume += txn.tradeAmount / VOLUME_SCALE_FACTOR;
        }
        lastId = data.transactions[data.transactions.length -1].id;
   }
   return tradeVolume;
}

const getTradeVolumePerUserWrapper = async (address: string): Promise<number> => {
    return await getTradeVolumePerUser(address, TS);
}

const getTradeVolumeBatched = batch({batchSize: 100}, getTradeVolumePerUserWrapper);

/**
 * Calculates total trade volume for a list of addresses, given a timestamp snapshot
 * 
 * @param addresses 
 * @param timestamp 
 * @returns 
 */
export const getTradeVolume = async (addresses: string[], timestamp: number): Promise<number[]> => {
    console.log(`Calculating trade volume for ${addresses.length} users`)
    TS = timestamp;
    const tradeVolume = await getTradeVolumeBatched(addresses);
    console.log(`Complete!`);
    return tradeVolume;
}