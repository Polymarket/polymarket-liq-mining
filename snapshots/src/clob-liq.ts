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
            for (const market of rewardMarkets) {
                const rewardTokensLiquidity = market["reward_tokens_liquidity"];
                for (const rewardToken of rewardTokensLiquidity) {
                    if (rewardToken["reward_token"]["id"] == tokenId) {
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
    const response = await fetch(
        `${clobUrl}/markets-included-in-epoch?epoch=${epoch.toString()}`,
        {
            method: "GET",
            headers: {
                POLY_INTL_ID: POLY_INTL_ID,
            },
        },
    );

    // The previous implementation ended in
    // `.catch((error) => { console.error("Error:", error); return "error"; })`.
    // The returned "error" was discarded -- it was the resolution value of the
    // `.catch` handler on an awaited chain whose result is never read -- so
    // `marketsList` stayed `[]` and the function resolved successfully with an
    // empty list. Downstream that is indistinguishable from "this epoch had no
    // reward markets": `getMakersInEpoch` finds no makers, the snapshot comes
    // out empty, and `run-liq-mining-snapshot.ts` proceeds to build a payout map
    // in which every eligible liquidity provider is simply absent. A rewards
    // pipeline must fail loudly rather than emit a valid-looking empty
    // distribution, so the request errors now propagate to the caller.
    if (!response.ok) {
        throw new Error(
            `markets-included-in-epoch returned HTTP ${response.status} for epoch ${epoch.toString()}`,
        );
    }

    const data = await response.json();
    const markets = data["markets"];
    if (!Array.isArray(markets)) {
        throw new Error(
            `markets-included-in-epoch returned no \`markets\` array for epoch ${epoch.toString()}`,
        );
    }

    return markets.map((x) => String(x));
};

export const getMakersInEpoch = async (
    clobUrl: string,
    epoch: number,
    marketsList: string[],
): Promise<Set<string>> => {
    const makers = new Set<string>();
    for (const market of marketsList) {
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
        for (const reward of rewards) {
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

        if (!data.ok) {
            throw new Error(
                `liquidity-rewards-by-maker-address returned HTTP ${data.status} for maker ${maker} in epoch ${epoch.toString()}`,
            );
        }

        const values = JSON.parse(
            (await data.arrayBuffer().then(Buffer.from)).toString(),
        );

        if (!Array.isArray(values)) {
            throw new Error(
                `liquidity-rewards-by-maker-address returned a non-array body for maker ${maker} in epoch ${epoch.toString()}`,
            );
        }

        for (const value of values) {
            // This loop used to end in `} catch {}`. Every failure inside it --
            // `value["market"]` being absent so `.toLowerCase()` threw, a
            // `qfinal` that did not parse -- silently dropped that market's
            // contribution to this maker's score and moved on. The run still
            // succeeded, so the only visible symptom was a maker being paid less
            // than they earned, with nothing in the output to say a row had been
            // skipped. Each failure mode is now handled explicitly: the ones that
            // are legitimate are skipped deliberately, and corrupt data aborts
            // the snapshot instead of quietly changing the payouts.
            const rawMarket = value["market"];
            if (typeof rawMarket !== "string" || rawMarket.length === 0) {
                throw new Error(
                    `liquidity-rewards-by-maker-address returned a row with no \`market\` for maker ${maker} in epoch ${epoch.toString()}`,
                );
            }
            const market = rawMarket.toLowerCase();

            const allocationForMarket = marketAllocations[market];
            if (allocationForMarket === undefined) {
                // Expected, not an error: `marketAllocations` is filtered to a
                // single reward token, while this endpoint reports every market
                // the maker scored in. A market with no allocation for the token
                // being distributed contributes nothing. Previously this produced
                // `qFinal * undefined === NaN`, and `NaN > 0` being false made
                // the skip work by accident -- the same accident that also hid
                // genuinely malformed allocations.
                continue;
            }
            if (!Number.isFinite(allocationForMarket)) {
                throw new Error(
                    `Allocation for market ${market} is not a finite number: ${String(allocationForMarket)}`,
                );
            }

            // `Number` rather than `parseFloat`: `parseFloat` stops at the first
            // invalid character, so "0.5x" silently becomes 0.5 and "1e" becomes
            // 1. For a value that scales a payout, a partially-parsed number is
            // worse than a rejected one. The empty string is excluded explicitly
            // because `Number("")` is 0, not NaN.
            const rawQFinal = value["qfinal"];
            const qFinal =
                typeof rawQFinal === "string" && rawQFinal.trim() !== ""
                    ? Number(rawQFinal)
                    : Number.NaN;
            if (!Number.isFinite(qFinal)) {
                throw new Error(
                    `Unparseable \`qfinal\` ${JSON.stringify(rawQFinal)} for maker ${maker} in market ${market}, epoch ${epoch.toString()}`,
                );
            }

            const score = qFinal * allocationForMarket;
            if (score > 0) {
                if (scoreMapping[maker] !== undefined) {
                    scoreMapping[maker] = scoreMapping[maker] + score;
                } else {
                    scoreMapping[maker] = score;
                }
            }
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

    console.log("Market allocations: ", marketAllocations);
    console.log("Token ID: ", tokenId);

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
