import { expect } from "chai";
import fetchMock from "fetch-mock";
import {
    getMarketsIncludedInEpoch,
    getTradersInEpoch,
    getLiquidtyRewardsForMakers,
    getClobLpSnapshot,
} from "../src/clob-liq";

describe("clob liq rewards calculated correctly", () => {
    it("should get markets included in epoch", async () => {
        fetchMock.once(
            "https://clob.polymarket.com/markets-included-in-epoch?epoch=30",
            JSON.stringify([
                "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                "93483829706271419755141541597999290384499264524196374818190642418621166604124",
            ]),
        );
        const markets = await getMarketsIncludedInEpoch(30);
        expect(markets[0]).to.eq(
            "66840793208895902134770756801876217714621927881254495944557040037466903434752",
        );
        expect(markets[1]).to.eq(
            "93483829706271419755141541597999290384499264524196374818190642418621166604124",
        );
    });

    it("should get traders in epoch", async () => {
        fetchMock.restore();
        fetchMock
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&market=66840793208895902134770756801876217714621927881254495944557040037466903434752",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                            maker_address:
                                "312510db-08c6-f089-cc99-5c72f6951882",
                            qfinal: ".25",
                        },
                        {
                            epoch: 30,
                            market: "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                            maker_address:
                                "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                            qfinal: ".75",
                        },
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&market=93483829706271419755141541597999290384499264524196374818190642418621166604124",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "93483829706271419755141541597999290384499264524196374818190642418621166604124",
                            maker_address:
                                "c5e247b7-4ac7-ff29-a152-04fda0a8766b",
                            qfinal: ".1123124",
                        },
                        {
                            epoch: 30,
                            market: "93483829706271419755141541597999290384499264524196374818190642418621166604124",
                            maker_address:
                                "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                            qfinal: ".8876876",
                        },
                    ],
                }),
            );
        const traders = await getTradersInEpoch(30, [
            "66840793208895902134770756801876217714621927881254495944557040037466903434752",
            "93483829706271419755141541597999290384499264524196374818190642418621166604124",
        ]);
        expect(traders.size).to.eq(3);
        expect(traders.has("312510db-08c6-f089-cc99-5c72f6951882")).to.eq(true);
        expect(traders.has("f4f247b7-4ac7-ff29-a152-04fda0a8755a")).to.eq(true);
        expect(traders.has("c5e247b7-4ac7-ff29-a152-04fda0a8766b")).to.eq(true);
    });

    it("should get liquidity rewards for makers", async () => {
        fetchMock.restore();
        fetchMock
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=312510db-08c6-f089-cc99-5c72f6951882",
                JSON.stringify({
                    maker_address: "312510db-08c6-f089-cc99-5c72f6951882",
                    qfinal: ".33",
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                JSON.stringify({
                    maker_address: "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                    qfinal: ".67",
                }),
            );
        const liqRewards = await getLiquidtyRewardsForMakers(
            30,
            [
                "312510db-08c6-f089-cc99-5c72f6951882",
                "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
            ],
            1000,
        );
        expect(liqRewards["312510db-08c6-f089-cc99-5c72f6951882"]).to.eq(330);
        expect(liqRewards["f4f247b7-4ac7-ff29-a152-04fda0a8755a"]).to.eq(670);
    });

    it("should get clob lp snapshot", async () => {
        fetchMock.restore();
        fetchMock
            .once(
                "https://clob.polymarket.com/markets-included-in-epoch?epoch=30",
                JSON.stringify([
                    "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                    "93483829706271419755141541597999290384499264524196374818190642418621166604124",
                ]),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&market=66840793208895902134770756801876217714621927881254495944557040037466903434752",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                            maker_address:
                                "312510db-08c6-f089-cc99-5c72f6951882",
                            qfinal: ".25",
                        },
                        {
                            epoch: 30,
                            market: "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                            maker_address:
                                "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                            qfinal: ".75",
                        },
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=30&market=93483829706271419755141541597999290384499264524196374818190642418621166604124",
                JSON.stringify({
                    rewards: [
                        {
                            epoch: 30,
                            market: "93483829706271419755141541597999290384499264524196374818190642418621166604124",
                            maker_address:
                                "c5e247b7-4ac7-ff29-a152-04fda0a8766b",
                            qfinal: ".1123124",
                        },
                        {
                            epoch: 30,
                            market: "93483829706271419755141541597999290384499264524196374818190642418621166604124",
                            maker_address:
                                "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                            qfinal: ".8876876",
                        },
                    ],
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=312510db-08c6-f089-cc99-5c72f6951882",
                JSON.stringify({
                    maker_address: "312510db-08c6-f089-cc99-5c72f6951882",
                    qfinal: ".33",
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                JSON.stringify({
                    maker_address: "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
                    qfinal: ".67",
                }),
            )
            .once(
                "https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=30&maker_address=c5e247b7-4ac7-ff29-a152-04fda0a8766b",
                JSON.stringify({
                    maker_address: "c5e247b7-4ac7-ff29-a152-04fda0a8766b",
                    qfinal: "0.0",
                }),
            );
        const liqRewards = await getClobLpSnapshot(30, 1000);
        expect(liqRewards["312510db-08c6-f089-cc99-5c72f6951882"]).to.eq(330);
        expect(liqRewards["f4f247b7-4ac7-ff29-a152-04fda0a8755a"]).to.eq(670);
        expect(liqRewards["c5e247b7-4ac7-ff29-a152-04fda0a8766b"]).to.eq(0);
    });
});
