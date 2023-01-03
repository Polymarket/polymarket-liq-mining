import { expect } from "chai";
import { fetch } from "cross-fetch";
import fetchMock from "fetch-mock";
import {
    getMarketsIncludedInEpoch,
    getMakersInEpoch,
    getLiquidtyRewardsForMakers,
    getClobLpSnapshot,
} from "../src/clob-liq";

const TEST_URL = "https://clob.polymarket.com";

describe("clob liq rewards calculated correctly", () => {
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
                JSON.stringify({
                    maker_address: "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                    qfinal: ".33",
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                JSON.stringify({
                    maker_address: "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                    qfinal: ".67",
                }),
            );
        const liqRewards = await getLiquidtyRewardsForMakers(
            TEST_URL,
            30,
            [
                "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
            ],
            1000,
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
                JSON.stringify({
                    maker_address: "0x11FAe40C66A22907A51C9b248e3dadD57e161f58",
                    qfinal: ".33",
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                JSON.stringify({
                    maker_address: "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                    qfinal: ".67",
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=0x94385591c282b9bdef577917d86517b6de4c1f65",
                JSON.stringify({
                    maker_address: "0x94385591c282b9bdef577917d86517b6de4c1f65",
                    qfinal: "0.0",
                }),
            );
        const liqRewards = await getClobLpSnapshot(TEST_URL, 30, 1000);
        expect(liqRewards["0x11FAe40C66A22907A51C9b248e3dadD57e161f58"]).to.eq(
            330,
        );
        expect(liqRewards["0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841"]).to.eq(
            670,
        );
        expect(liqRewards["0x94385591c282b9bdef577917d86517b6de4c1f65"]).to.eq(
            0,
        );
    });
});
