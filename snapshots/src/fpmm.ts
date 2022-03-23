import { batch } from "promises-tho";
import { getFixedProductMarketMakerQuery } from "./queries";
import { queryGqlClient } from "./gql_client";

export interface FixedProductMarketMaker {
    id: string;
    poolMembers: { funder: { id: string }; amount: number }[];
    scaledLiquidityParameter: number;
    totalSupply: number;
    outcomeTokenPrices: number[];
    outcomeTokenAmounts: number[];
}

/**
 * Calculates LP positions, given a fixed product market maker
 * @param fpmm
 * @returns
 */
export async function calcLpPositions(
    fpmm: FixedProductMarketMaker,
): Promise<any> {
    const outcomeTokenPrices = fpmm.outcomeTokenPrices;
    const outcomeTokenAmounts = fpmm.outcomeTokenAmounts;
    const scaledLiquidityParameter = fpmm.scaledLiquidityParameter;
    const totalSupply = fpmm.totalSupply;

    const lpLiquidityAtBlock = {};

    if (scaledLiquidityParameter > 0) {
        for (const liquidityProvider of fpmm.poolMembers) {
            const lpAddress = liquidityProvider.funder.id;
            const lpRatio = liquidityProvider.amount / totalSupply;
            const totalPoolValUsd =
                (outcomeTokenAmounts[0] * outcomeTokenPrices[0] +
                    outcomeTokenAmounts[1] * outcomeTokenPrices[1]) /
                Math.pow(10, 6);
            const lpPoolValUsd = lpRatio * totalPoolValUsd;
            lpLiquidityAtBlock[lpAddress] = lpPoolValUsd;
        }
    }
    return lpLiquidityAtBlock;
}

/**
 * Calculate liquidity for each LP at a market, at a block
 * @param marketAddress
 * @param block
 * @returns
 */
export const calculateValOfLpPositions = async (
    marketAddress: string,
    block: number,
): Promise<any> => {
    const fpmm: FixedProductMarketMaker = await getFpmm(marketAddress, block);
    if (!fpmm) {
        console.log(
            "\n\n\n\n\n\n",
            "NO FPMM!",
            "\n",
            "market maker: ",
            marketAddress,
            "\n",
            "at block: ",
            block,
            "\n\n\n\n\n\n",
        );

        console.log("NO FPMM!", marketAddress, "block: ", block);
    }
    if (fpmm) {
        return await calcLpPositions(fpmm);
    }
};

/**
 * Given a market and a block, fetch FPMM details as they existed at that block
 * @param marketAddress
 * @param block
 */
export const getFpmm = async (
    marketAddress: string,
    block: number,
): Promise<FixedProductMarketMaker> => {
    // eslint-disable-next-line no-useless-catch
    let retryCount = 0;
    const { tries, startMs, pow, maxMs, jitter } = {
        tries: 3,
        startMs: 500,
        pow: 3,
        maxMs: 300000,
        jitter: 0.25,
    };

    while (retryCount < tries) {
        try {
            const { data } = await queryGqlClient(
                getFixedProductMarketMakerQuery,
                {
                    market: marketAddress,
                    block: block,
                },
            );
            return data.fixedProductMarketMaker;
        } catch (err) {
            console.log(
                "\n",
                "marketAddress",
                marketAddress,
                "block",
                block,
                "retryCount",
                retryCount,
                "\n",
            );

            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) =>
                setTimeout(res, delay - Math.random() * delay * jitter),
            );
        }
    }

    console.log(
        "\n\n\n\n\n\nRetry count exceeded",
        "marketAddress",
        marketAddress,
        "block",
        block,
        "\n\n\n\n\n\n",
    );
};

const calculateValOfLpPositionsWrapper = async (args: {
    marketAddress: string;
    block: number;
}): Promise<any> => {
    return await calculateValOfLpPositions(args.marketAddress, args.block);
};

const calculateValOfLpPositionsBatched = batch(
    { batchSize: 75 },
    calculateValOfLpPositionsWrapper,
);

export const calculateValOfLpPositionsAcrossBlocks = async (
    marketAddress: string,
    samples: number[],
): Promise<any> => {
    console.log(
        `Calculating value of LP positions for market: ${marketAddress} across ${samples.length} samples!`,
    );
    const args: { marketAddress: string; block: number }[] = [];
    for (const block of samples) {
        args.push({ marketAddress: marketAddress, block: block });
    }
    return await calculateValOfLpPositionsBatched(args);
};
