import { MapOfCount } from "./interfaces";
import "cross-fetch/polyfill"; // polyfill vs ponyfill
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
    clobUrl: string,
    epoch: number,
): Promise<string[]> => {
    let marketsList: string[] = [];
    await fetch(
        `${clobUrl}/markets-included-in-epoch?epoch=${epoch.toString()}`,
        {
            method: "GET",
            headers: {
                POLY_INTL_ID: POLY_INTL_ID,
            },
        },
    )
        .then((response) => response.json())
        .then((data) => {
            marketsList = data["markets"].map((x) => String(x));
        })
        .catch((error) => {
            console.error("Error:", error);
            return "error";
        });
    return marketsList;
};

export const getTradersInEpoch = async (
    clobUrl: string,
    epoch: number,
    marketsList: string[],
): Promise<Set<string>> => {
    let makers = new Set<string>();
    for (var market of marketsList) {
        const data = await fetch(
            `${clobUrl}/liquidity-rewards-by-epoch?epoch=${epoch.toString()}&market=${market}`,
            {
                method: "GET",
                headers: {
                    POLY_INTL_ID: POLY_INTL_ID,
                },
            },
        );

        const buff = await data.arrayBuffer().then(Buffer.from);

        const rewards: rewardsInt[] = JSON.parse(buff.toString())["rewards"];
        for (var reward of rewards) {
            makers.add(reward.maker_address);
        }
    }
    return makers;
};

export const getLiquidtyRewardsForMakers = async (
    clobUrl: string,
    epoch: number,
    makerList: string[],
    feeTokenSupply: number,
): Promise<MapOfCount> => {
    let scoreMapping = {};
    for (var maker of makerList) {
        const data = await fetch(
            `${clobUrl}/liquidity-rewards-by-maker-address?epoch=${epoch.toString()}&maker_address=${maker}`,
            {
                method: "GET",
            },
        );
        const buff = await data.arrayBuffer().then(Buffer.from);

        const score = parseFloat(JSON.parse(buff.toString())["qfinal"]);
        scoreMapping[maker] = score * feeTokenSupply;
    }
    return scoreMapping;
};

export const getClobLpSnapshot = async (
    clobUrl: string,
    epoch: number,
    feeTokenSupply: number,
): Promise<MapOfCount> => {
    // get markets

    const marketsList = await getMarketsIncludedInEpoch(clobUrl, epoch);
    const makers = await getTradersInEpoch(clobUrl, epoch, marketsList);
    const liqRewardsPerMaker = await getLiquidtyRewardsForMakers(
        clobUrl,
        epoch,
        Array.from(makers),
        feeTokenSupply,
    );

    return liqRewardsPerMaker;
};
