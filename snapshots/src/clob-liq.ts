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

export const getMarketAllocations = async (
    strapiUrl: string,
    tokenId: string,
    epoch: number,
): Promise<{ [market: string]: number }> => {
    const marketToReward: { [market: string]: number } = {};
    await fetch(`${strapiUrl}/reward-epoches/${epoch.toString()}`)
        .then((response) => response.json())
        .then((data) => {
            const rewardMarkets = data["reward_markets"];
            for (var market of rewardMarkets) {
                const rewardTokensLiquidity = market["reward_tokens_liquidity"];
                for (var rewardToken of rewardTokensLiquidity) {
                    if (
                        rewardToken["reward_token"]["name"].toLowerCase() ==
                        tokenId.toLowerCase()
                    ) {
                        const conditionId =
                            market["market"]["conditionId"].toLowerCase();
                        marketToReward[conditionId] = Number(
                            rewardToken["clob_token_supply"],
                        );
                    }
                }
            }
        });
    return marketToReward;
};

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

export const getMakersInEpoch = async (
    clobUrl: string,
    epoch: number,
    marketsList: string[],
): Promise<Set<string>> => {
    let makers = new Set<string>();
    for (var market of marketsList) {
        const data = await fetch(
            `${clobUrl}/liquidity-rewards-by-epoch?epoch=${epoch.toString()}&condition_id=${market}`,
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

export const getLiquidityRewardsForMakers = async (
    clobUrl: string,
    epoch: number,
    makerList: string[],
    marketAllocations: {
        [market: string]: number;
    },
): Promise<MapOfCount> => {
    const scoreMapping = {};
    for (const maker of makerList) {
        const data = await fetch(
            `${clobUrl}/liquidity-rewards-by-maker-address?epoch=${epoch.toString()}&maker_address=${maker}`,
            {
                method: "GET",
            },
        );
        const values = JSON.parse(
            (await data.arrayBuffer().then(Buffer.from)).toString(),
        );

        for (var value of values) {
            try {
                const market = value["market"].toLowerCase();
                const allocationForMarket = marketAllocations[market];
                const qFinal = parseFloat(value["qfinal"]);
                const score = qFinal * allocationForMarket;
                if (scoreMapping[maker] !== undefined) {
                    scoreMapping[maker] = scoreMapping[maker] + score;
                } else {
                    scoreMapping[maker] = score;
                }
            } catch {}
        }
    }
    return scoreMapping;
};

export const getClobLpSnapshot = async (
    strapiUrl: string,
    clobUrl: string,
    epoch: number,
    tokenId: string,
): Promise<MapOfCount> => {
    // get markets
    const marketAllocations = await getMarketAllocations(
        strapiUrl,
        tokenId,
        epoch,
    );

    const marketsList = await getMarketsIncludedInEpoch(clobUrl, epoch);
    const makers = await getMakersInEpoch(clobUrl, epoch, marketsList);
    const liqRewardsPerMaker = await getLiquidityRewardsForMakers(
        clobUrl,
        epoch,
        Array.from(makers),
        marketAllocations,
    );

    return liqRewardsPerMaker;
};
