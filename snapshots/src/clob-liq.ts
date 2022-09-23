import { RewardEpochFromStrapi } from "./lp-helpers";
import { MapOfCount } from "./interfaces";
import "cross-fetch";
import { POLY_INTL_ID } from "./constants";

export interface rewardsInt {
    epoch: number;
    market: string;
    maker_address: string;
    qfinal: string;
}

export interface makerScore {
    maker_address: string;
    qfinal: string;
}

export const getMarketsIncludedInEpoch = async (
    epoch: number,
): Promise<string[]> => {
    let marketsList: string[] = [];
    console.log(POLY_INTL_ID);
    await fetch(
        `https://clob.polymarket.com/markets-included-in-epoch?epoch=${epoch.toString()}`,
        {
            method: "GET",
            headers: {
                POLY_INTL_ID: POLY_INTL_ID,
            },
        },
    )
        .then((response) => response.json())
        .then((data) => {
            marketsList = data.map((x) => String(x));
        })
        .catch((error) => {
            console.error("Error:", error);
            return "error";
        });
    return marketsList;
};

export const getTradersInEpoch = async (
    epoch: number,
    marketsList: string[],
): Promise<Set<string>> => {
    let makers = new Set<string>();
    for (var market of marketsList) {
        const data = await fetch(
            `https://clob.polymarket.com/liquidity-rewards-by-epoch?epoch=${epoch.toString()}&market=${market}`,
            {
                method: "GET",
                headers: {
                    POLY_INTL_ID: POLY_INTL_ID,
                },
            },
        );

        const buff = await data.arrayBuffer().then(Buffer.from);

        console.log(JSON.parse(buff.toString())["rewards"]);
        JSON.parse(buff.toString());
        const rewards: rewardsInt[] = JSON.parse(buff.toString())["rewards"];
        for (var reward of rewards) {
            makers.add(reward.maker_address);
        }
    }
    return makers;
};

export const getLiquidtyRewardsForMakers = async (
    epoch: number,
    makerList: string[],
    feeTokenSupply: number,
): Promise<MapOfCount> => {
    let scoreMapping = {};
    for (var maker of makerList) {
        const data = await fetch(
            `https://clob.polymarket.com/liquidity-rewards-by-maker-address?epoch=${epoch.toString()}&maker_address=${maker}`,
            {
                method: "GET",
            },
        );
        const makerScore: makerScore = await data.json();
        const score = parseFloat(makerScore.qfinal);
        scoreMapping[maker] = score * feeTokenSupply;
    }
    return scoreMapping;
};

export const getClobLpSnapshot = async (
    epoch: RewardEpochFromStrapi,
    feeTokenSupply: number,
): Promise<MapOfCount> => {
    // get markets

    const marketsList = await getMarketsIncludedInEpoch(epoch.epoch);
    const makers = await getTradersInEpoch(epoch.epoch, marketsList);
    const liqRewardsPerMaker = await getLiquidtyRewardsForMakers(
        epoch.epoch,
        Array.from(makers),
        feeTokenSupply,
    );

    return liqRewardsPerMaker;
};
