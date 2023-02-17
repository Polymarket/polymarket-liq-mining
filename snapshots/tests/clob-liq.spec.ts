import { expect } from "chai";
import fetchMock from "fetch-mock";
import {
    getMarketsIncludedInEpoch,
    getMakersInEpoch,
    getLiquidityRewardsForMakers,
    getClobLpSnapshot,
    getMarketAllocations,
} from "../src/clob-liq";

const TEST_URL = "https://clob.polymarket.com";
const TEST_STRAPI_URL = "https://strapi-matic.poly.market";

describe("clob liq rewards calculated correctly", () => {
    it("should get market allocations", async () => {
        fetchMock.mock(
            "https://strapi-matic.poly.market/reward-epoches/43",
            JSON.stringify({
                id: 144,
                epoch: 43,
                reward_tokens: [
                    {
                        id: 262,
                        reward_token: {
                            id: 2,
                            symbol: "usdc",
                            name: "USDC",
                            icon: {},
                        },
                        fees_token_supply: null,
                        amm_fees_token_supply: "25",
                        clob_fees_token_supply: "0",
                        clob_liqudity_token_supply: "0",
                    },
                    {
                        id: 263,
                        reward_token: {
                            id: 1,
                            symbol: "uma",
                            name: "UMA",
                            icon: {},
                        },
                        fees_token_supply: null,
                        amm_fees_token_supply: "25",
                        clob_fees_token_supply: "0",
                        clob_liqudity_token_supply: "0",
                    },
                ],
                lp_display_supply: [{}],
                fee_display_supply: [{}],
                reward_markets: [
                    {
                        id: 1252,
                        reward_epoch: 144,
                        lp_token_supply: null,
                        token_calculation: null,
                        market: {
                            conditionId:
                                "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                        },
                        reward_tokens_liquidity: [
                            {
                                id: 2508,
                                reward_token: {
                                    id: 2,
                                    symbol: "usdc",
                                    name: "USDC",
                                },
                                token_calculation: "perMarket",
                                lp_token_supply: "50",
                                clob_token_supply: "50",
                            },
                            {
                                id: 2509,
                                reward_token: {
                                    id: 1,
                                    symbol: "uma",
                                    name: "UMA",
                                },
                                token_calculation: "perMarket",
                                lp_token_supply: "50",
                                clob_token_supply: "75",
                            },
                        ],
                    },
                ],
            }),
        );
        const usdcMarketAllocations = await getMarketAllocations(
            TEST_STRAPI_URL,
            "2",
            43,
        );
        const umaMarketAllocations = await getMarketAllocations(
            TEST_STRAPI_URL,
            "1",
            43,
        );
        expect(
            usdcMarketAllocations[
                "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222"
            ],
        ).to.eq(50);
        expect(
            umaMarketAllocations[
                "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222"
            ],
        ).to.eq(75);
    });

    it("should get markets included in epoch", async () => {
        fetchMock.once(
            "https://clob.polymarket.com/markets-included-in-epoch?epoch=30",
            JSON.stringify({
                markets: [
                    "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                    "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                ],
            }),
        );
        const markets = await getMarketsIncludedInEpoch(TEST_URL, 30);
        expect(markets[0]).to.eq(
            "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
        );
        expect(markets[1]).to.eq(
            "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
        );
    });

    it("should get makers in epoch", async () => {
        fetchMock.restore();
        fetchMock
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&condition_id=0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                            maker_address:
                                "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                            qfinal: ".25",
                        },
                        {
                            epoch: 30,
                            market: "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                            maker_address:
                                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                            qfinal: ".75",
                        },
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&condition_id=0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                            maker_address:
                                "0x94385591c282b9bdef577917d86517b6de4c1f65",
                            qfinal: ".1123124",
                        },
                        {
                            epoch: 30,
                            market: "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                            maker_address:
                                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                            qfinal: ".8876876",
                        },
                    ],
                }),
            );
        const makers = await getMakersInEpoch(TEST_URL, 30, [
            "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
            "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
        ]);
        expect(makers.size).to.eq(3);
        expect(makers.has("0x11FAe40C66A22907A51C9b248e3dadD57e161f58")).to.eq(
            true,
        );
        expect(makers.has("0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841")).to.eq(
            true,
        );
        expect(makers.has("0x94385591c282b9bdef577917d86517b6de4c1f65")).to.eq(
            true,
        );
    });

    it("should get liquidity rewards for makers", async () => {
        fetchMock.restore();
        fetchMock
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                JSON.stringify([
                    {
                        maker_address:
                            "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                        qfinal: ".33",
                        market: "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                        epoch: 30,
                    },
                ]),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                JSON.stringify([
                    {
                        maker_address:
                            "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                        qfinal: ".67",
                        market: "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                        epoch: 30,
                    },
                ]),
            );
        const testAllocation = {};
        testAllocation[
            "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222"
        ] = 1000;
        const liqRewards = await getLiquidityRewardsForMakers(
            TEST_URL,
            30,
            [
                "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
            ],
            testAllocation,
        );
        expect(liqRewards["0x11FAe40C66A22907A51C9b248e3dadD57e161f58"]).to.eq(
            330,
        );
        expect(liqRewards["0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841"]).to.eq(
            670,
        );
    });

    it("should get clob lp snapshot", async () => {
        fetchMock.restore();
        fetchMock
            .once(
                "https://clob.polymarket.com/markets-included-in-epoch?epoch=30",
                JSON.stringify({
                    markets: [
                        "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                        "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&condition_id=0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                            maker_address:
                                "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                            qfinal: ".25",
                        },
                        {
                            epoch: 30,
                            market: "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
                            maker_address:
                                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                            qfinal: ".75",
                        },
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&condition_id=0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                            maker_address:
                                "0x94385591c282b9bdef577917d86517b6de4c1f65",
                            qfinal: ".1123124",
                        },
                        {
                            epoch: 30,
                            market: "0x11aa40a5fdf9ca528a3f40f0960addf98993b717e66a35bf09fe5443b5ba82c2",
                            maker_address:
                                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                            qfinal: ".8876876",
                        },
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                JSON.stringify([
                    {
                        maker_address:
                            "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                        qfinal: ".33",
                        market: "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                        epoch: 30,
                    },
                ]),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                JSON.stringify([
                    {
                        maker_address:
                            "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                        qfinal: ".67",
                        market: "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                        epoch: 30,
                    },
                ]),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0x94385591c282b9bdef577917d86517b6de4c1f65",
                JSON.stringify([
                    {
                        maker_address:
                            "0x94385591c282b9bdef577917d86517b6de4c1f65",
                        qfinal: "0.0",
                        market: "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                        epoch: 30,
                    },
                ]),
            )
            .once(
                "https://strapi-matic.poly.market/reward-epoches/30",
                JSON.stringify({
                    id: 144,
                    epoch: 43,
                    reward_tokens: [
                        {
                            id: 262,
                            reward_token: {
                                id: 2,
                                symbol: "usdc",
                                name: "USDC",
                                icon: {},
                            },
                            fees_token_supply: null,
                            amm_fees_token_supply: "25",
                            clob_fees_token_supply: "0",
                            clob_liqudity_token_supply: "0",
                        },
                        {
                            id: 263,
                            reward_token: {
                                id: 1,
                                symbol: "uma",
                                name: "UMA",
                                icon: {},
                            },
                            fees_token_supply: null,
                            amm_fees_token_supply: "25",
                            clob_fees_token_supply: "0",
                            clob_liqudity_token_supply: "0",
                        },
                    ],
                    lp_display_supply: [{}],
                    fee_display_supply: [{}],
                    reward_markets: [
                        {
                            id: 1252,
                            reward_epoch: 144,
                            lp_token_supply: null,
                            token_calculation: null,
                            market: {
                                conditionId:
                                    "0xb5858726a0b48b44465ee6c6d0d8fc913bde224ebb1045a537a687cfe1171222",
                            },
                            reward_tokens_liquidity: [
                                {
                                    id: 2508,
                                    reward_token: {
                                        id: 2,
                                        symbol: "usdc",
                                        name: "USDC",
                                    },
                                    token_calculation: "perMarket",
                                    lp_token_supply: "50",
                                    clob_token_supply: "1000",
                                },
                                {
                                    id: 2509,
                                    reward_token: {
                                        id: 1,
                                        symbol: "uma",
                                        name: "UMA",
                                    },
                                    token_calculation: "perMarket",
                                    lp_token_supply: "50",
                                    clob_token_supply: "75",
                                },
                            ],
                        },
                    ],
                }),
            );
        const liqRewards = await getClobLpSnapshot(
            TEST_STRAPI_URL,
            TEST_URL,
            30,
            "2",
        );
        expect(liqRewards["0x11FAe40C66A22907A51C9b248e3dadD57e161f58"]).to.eq(
            330,
        );
        expect(liqRewards["0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841"]).to.eq(
            670,
        );
        expect(liqRewards["0x94385591c282b9bdef577917d86517b6de4c1f65"]).to.eq(
            undefined,
        );
    });
});
