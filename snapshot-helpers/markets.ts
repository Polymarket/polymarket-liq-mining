import { allMarketsQuery } from "./queries";
import { queryGqlClient } from "./gql_client";
import { normalizeTimestamp } from "./utils";


export interface Market {
    marketAddress: string
    creationTransactionHash: string
}


/**
 * Pull all markets from the subgraph 
 * @param timestamp
 */
 export const getAllMarkets = async (timestamp: number) : Promise<Market[]> => {
    let lastId = "";
    const markets: Market[] = [];
    console.log(`Pulling all markets from subgraph...`);
    const search = true;
    
    const timestampInSeconds = normalizeTimestamp(timestamp);
    while(search) {
        const { data } = await queryGqlClient(allMarketsQuery, 
            {lastId: lastId, timestamp: `${timestampInSeconds}`}
        );

        if(data.fixedProductMarketMakers.length == 0){
            break;
        }

        for(const fpmm of data.fixedProductMarketMakers){
            markets.push({marketAddress: fpmm.id, creationTransactionHash: fpmm.creationTransactionHash});
        }
        lastId = data.fixedProductMarketMakers[data.fixedProductMarketMakers.length - 1].id;
   }

   console.log(`Found ${markets.length} markets!`);
   return markets;
}

