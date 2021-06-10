import { batch } from "promises-tho";
import * as gClient from "./gql_client";
import * as queries from "./queries";


const VOLUME_SCALE_FACTOR = Math.pow(10, 6);

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
        const { data } = await gClient.queryGqlClient(queries.getTradeVolumePerUserQuery, 
            {lastId: lastId, user: address, timestamp: `${timestamp}`}
        );

        if(data.transactions.length == 0){
            break;
        }

        for(const txn of data.transactions){
            tradeVolume += parseInt(txn.tradeAmount);
        }
        lastId = data.transactions[data.transactions.length -1].id;
   }
   return tradeVolume / VOLUME_SCALE_FACTOR;
}

const getTradeVolumePerUserWrapper = async (arg: {address: string, timestamp: number}): Promise<number> => {
    return await getTradeVolumePerUser(arg.address, arg.timestamp);
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
    const args: {address: string, timestamp: number}[] = [];
    for(const address of addresses){
        args.push({address: address, timestamp: timestamp})
    }
    const tradeVolume = await getTradeVolumeBatched(args)
    return tradeVolume;
}