import { expect } from 'chai';
import { calcLpPositions, FixedProductMarketMaker } from "../src/fpmm";


describe('FPMM Tests', () => {
    let mockFpmm: FixedProductMarketMaker;

    before("Mock FPMM", async function() {
        mockFpmm = {
            id: '0x012fbf9a6320ac4b244cac49e391e901932ac7b4',
            outcomeTokenAmounts: [25802669173, 4348726042],
            outcomeTokenPrices: [0.5, 0.5],
            poolMembers: [
                {amount: 50000000, funder: {id: "0xa"}},
                {amount: 2000000, funder: {id: "0xb"}}
            ],
            scaledLiquidityParameter: 10592.862662,
            totalSupply: 15093632511
        };
      });


    it('Calculate individual LP value in pool, given FPMM', async () => {
        const liquidityMapping = await calcLpPositions(mockFpmm);

        const totalValueInPool = ((mockFpmm.outcomeTokenAmounts[0] * mockFpmm.outcomeTokenPrices[0]) + 
            (mockFpmm.outcomeTokenAmounts[1] * mockFpmm.outcomeTokenPrices[1])) / Math.pow(10,6);
        

        //Verify pool value calculations
        for(const lpAddress of Object.keys(liquidityMapping)){
            const actualLpValueInPool = liquidityMapping[lpAddress];
            const poolMember = mockFpmm.poolMembers.filter(i=>i.funder.id == lpAddress)[0];
            const expectedLpValueInPool = (poolMember.amount/ mockFpmm.totalSupply) * totalValueInPool;
            expect(actualLpValueInPool).to.eq(expectedLpValueInPool);
        }
    })

    
})