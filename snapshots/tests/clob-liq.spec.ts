import { expect } from "chai";
//import { jest } from "@jest/globals";
//import fetchMock from "jest-fetch-mock";
import fetchMock from "fetch-mock";
import { getMarketsIncludedInEpoch, getTradersInEpoch } from "../src/clob-liq";

//fetchMock.enableMocks();

describe("clob liq rewards calculated correctly", () => {
    it("", async () => {
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

    it("", async () => {
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
                                "0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841",
                            qfinal: ".25",
                        },
                        {
                            epoch: 30,
                            market: "66840793208895902134770756801876217714621927881254495944557040037466903434752",
                            maker_address:
                                "0x38Cb1f3A8396323baa129d23C276e495373e9c01",
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
                                "0x47CB02DB3de9e536807fb2cEfDd42D937fEe3027",
                            qfinal: ".1123124",
                        },
                        {
                            epoch: 30,
                            market: "93483829706271419755141541597999290384499264524196374818190642418621166604124",
                            maker_address:
                                "0x38Cb1f3A8396323baa129d23C276e495373e9c01",
                            qfinal: ".8876876",
                        },
                    ],
                }),
            );
        const traders = await getTradersInEpoch(30, [
            "66840793208895902134770756801876217714621927881254495944557040037466903434752",
            "93483829706271419755141541597999290384499264524196374818190642418621166604124",
        ]);
        console.log(traders);
        expect(traders.size).to.eq(3);
        expect(traders.has("0x38Cb1f3A8396323baa129d23C276e495373e9c01")).to.eq(
            true,
        );
        expect(traders.has("0xEA5981CA48Dc40C950fC1B2496c4a0Ef900bB841")).to.eq(
            true,
        );
        expect(traders.has("0x47CB02DB3de9e536807fb2cEfDd42D937fEe3027")).to.eq(
            true,
        );
    });
});
