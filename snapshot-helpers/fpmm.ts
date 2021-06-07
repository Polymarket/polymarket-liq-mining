import { getFixedProductMarketMakerQuery } from "./queries";
import { queryGqlClient } from "./gql_client";


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

