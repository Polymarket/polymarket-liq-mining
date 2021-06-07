/*TODO: 

Calculate weighted lp value query per trader over Polymarket's entire history.

{ lpAddress: lpPoints, ...}

a liquidity provider's LP points should be calculated as
 1 point per $1 per 1 block of liquidity provided. 


*/

import { getAllMarkets } from "../snapshot-helpers";


const snapshot: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

export async function generateLpSnapshot(timestamp: number, supply: number): Promise<any> {
    
    console.log(`Generating lp weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    // get all markets in Poly history
    const markets: string[] = await getAllMarkets(timestamp); 
    
    return snapshot;
}