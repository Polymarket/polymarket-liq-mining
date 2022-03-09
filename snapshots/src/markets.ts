import { allMarketsQuery } from "./queries";
import { queryGqlClient } from "./gql_client";
import { normalizeTimestamp } from "./utils";

/**
 * Pull all markets from the subgraph
 * @param timestamp
 */
export const getAllMarkets = async (timestamp: number): Promise<string[]> => {
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
            let lastId = "";
            const markets: string[] = [];
            console.log(`Pulling all markets from subgraph...`);
            const search = true;

            const timestampInSeconds = normalizeTimestamp(timestamp);
            while (search) {
                const { data } = await queryGqlClient(allMarketsQuery, {
                    lastId: lastId,
                    timestamp: `${timestampInSeconds}`,
                });

                if (data.fixedProductMarketMakers.length == 0) {
                    break;
                }

                for (const fpmm of data.fixedProductMarketMakers) {
                    markets.push(fpmm.id);
                }
                lastId =
                    data.fixedProductMarketMakers[
                        data.fixedProductMarketMakers.length - 1
                    ].id;
            }

            console.log(`Found ${markets.length} markets!`);
            return markets;
        } catch (err) {
            console.log(
                "\n\n\n\n\n\n",
                "timestamp",
                timestamp,
                "retryCount",
                retryCount,
                "\n\n\n\n\n\n",
            );

            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) =>
                setTimeout(res, delay - Math.random() * delay * jitter),
            );
        }
    }

    console.log(
        "\n\n\n\n\n\ngetAllMarkets-Retry count exceeded",
        "timestamp",
        timestamp,
        "\n\n\n\n\n\n",
    );
};
