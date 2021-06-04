import { allMarketsQuery } from "./queries";
import { queryGqlClient } from "./gql_client";
import { normalizeTimestamp } from "./utils";


/**
 * Pull all markets from the subgraph 
 * @param timestamp
 */
 export const getAllMarkets = async (timestamp: number) : Promise<string[]> => {
    let lastId = "";
    const markets: string[] = [];
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
            markets.push(fpmm.id);
        }
        lastId = data.fixedProductMarketMakers[data.fixedProductMarketMakers.length -1].id;
   }
   console.log(`Found ${markets.length} markets!`);
   return markets;
}

