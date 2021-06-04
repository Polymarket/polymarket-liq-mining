import { ApolloClient, createHttpLink, DefaultOptions, InMemoryCache, gql } from "@apollo/client/core";
import fetch from "cross-fetch";

import * as dotenv from "dotenv";

dotenv.config();

const defaultOptions: DefaultOptions = {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
  };

const client = new ApolloClient({
    link: createHttpLink({
      uri: process.env.SUBGRAPH_URL,
      fetch,
    }),
    cache: new InMemoryCache(),
    defaultOptions,
  });

const myQuery = gql`
{
    fixedProductMarketMaker(block: {number: 15336000}
      id:"0x2690000e40f746dad3157f95848cecbe5857dd5b", 
     ) {
      id
      poolMembers{
        funder{
          id
        }
        amount
      }
      lastActiveDay
      scaledLiquidityParameter
      liquidityParameter
      outcomeSlotCount
      outcomeTokenPrices
      outcomeTokenAmounts
      scaledCollateralVolume
      scaledFeeVolume
      totalSupply
      scaledFeeVolume
    }
  }
`;



async function main(): Promise<any> {
    console.log(`sending query...`);
    
    const {data} = await client.query({
        query: myQuery
      });
    const fpmm = data["fixedProductMarketMaker"];
    const poolMembers = fpmm["poolMembers"];

    const totalSupply = fpmm['totalSupply'];
    const outcomeTokenPrices = fpmm['outcomeTokenPrices'];
    const outcomeTokenAmounts = fpmm['outcomeTokenAmounts'];
    const scaledLiquidityParameter = fpmm['scaledLiquidityParameter'];

    console.log(`Fpmm details:`)
    console.log(`scaledLiquidityParameter: ${scaledLiquidityParameter}`);
    console.log(`outcomeTokenAmounts: ${outcomeTokenAmounts}`);
    console.log(`outcomeTokenPrices: ${outcomeTokenPrices}`);
    console.log(`totalSupply: ${totalSupply}`);

    let lp;
    for(const poolMember of poolMembers){
        const address = poolMember.funder.id;
        if(address == "0x984e0e64116757872378946769741d8d62d7ce6a"){
            lp = poolMember;
        }
    }

    //User: 0x7789806c754eb0af4c3abeb026c218b4ba78f823 	
    // console.log(`LP: `);
    // console.log(lp);
    //Lp amount is amount on the pool owner
    const lpAmount = parseInt(lp.amount) / Math.pow(10, 6);
    const lpRatio = lpAmount / scaledLiquidityParameter;

    console.log(`Lp ratio: ${lpRatio}`);
    const funder_share_0_of_pool_usd = (lpRatio * outcomeTokenAmounts[0] * outcomeTokenPrices[0]) / Math.pow(10,6);
    const funder_share_1_of_pool_usd = (lpRatio * outcomeTokenAmounts[1] * outcomeTokenPrices[1]) / Math.pow(10,6);
    const totalLpShareOfPool = funder_share_0_of_pool_usd + funder_share_1_of_pool_usd

    console.log(`Funder USD share 0: ${funder_share_0_of_pool_usd}`);
    console.log(`Funder USD share 1: ${funder_share_1_of_pool_usd}`);
    console.log(`Total USD value of funder at block: ${totalLpShareOfPool}`);
    console.log(`Done!!`)
}


main();