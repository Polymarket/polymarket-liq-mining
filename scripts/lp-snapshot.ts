/*TODO: 

Calculate weighted lp value query per trader over Polymarket's entire history.

{ lpAddress: lpPoints, ...}

a liquidity provider's LP points should be calculated as 1 point per $1 per 1 block of liquidity provided. Liquidity value and quantity supplied should be calculated based on the beginning state of each block. 

Must be using only our subgraph or other open data. Might need to use our amm-maths repo for some helper functions. Should pull in any function you need so that the deliverable is standalone, requiring no private repos. 

*/