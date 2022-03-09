import * as queries from "./queries";
import { queryGqlClient } from "./gql_client";
// import { EXCLUDED_ACCOUNTS } from "./ban_list";
import { normalizeTimestamp } from "./utils";
import { UserAmount } from "./interfaces";

/**
 * Pull all transactions from the subgraph in the last epoch
 * @param startTimestamp - get all tx after this timestamp
 * @param endTimestamp - get all tx before this timestamp
 */
export const getAllFeesInEpoch = async (
    startTimestamp: number,
    endTimestamp: number,
): Promise<UserAmount[]> => {
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
            const search = true;
            const startTimestampInSeconds = normalizeTimestamp(startTimestamp);
            const endTimestampInSeconds = normalizeTimestamp(endTimestamp);
            const usersWithTransactions = [];
            while (search) {
                //Subgraph can only pull 1k accounts at a time,
                const { data } = await queryGqlClient(
                    queries.getUsersWhoPaidFeesInEpochQuery,
                    {
                        startTimestamp: `${startTimestampInSeconds}`,
                        endTimestamp: `${endTimestampInSeconds}`,
                        lastId: lastId,
                    },
                );

                if (!data.transactions || data.transactions.length === 0) {
                    break;
                }

                for (const account of data.transactions) {
                    if (
                        account.feeAmount &&
                        parseInt(account.feeAmount) > 0 &&
                        account.user &&
                        account.user.id
                    ) {
                        usersWithTransactions.push({
                            user: account.user.id,
                            amount: account.feeAmount,
                        });
                    }
                }
                lastId = data.transactions[data.transactions.length - 1].id;
            }
            console.log(`Found ${usersWithTransactions.length} transactions!`);
            return usersWithTransactions;
        } catch (err) {
            console.log(
                "\n\n\n\n\n\n",
                "startTimestamp",
                startTimestamp,
                "endTimestamp",
                endTimestamp,
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
        "\n\n\n\n\n\ngetAllFeesInEpoch-Retry count exceeded",
        "startTimestamp",
        startTimestamp,
        "endTimestamp",
        endTimestamp,
        "\n\n\n\n\n\n",
    );
};
