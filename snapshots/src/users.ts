import * as queries from "./queries";
import { queryGqlClient } from "./gql_client";
import { EXCLUDED_ACCOUNTS } from "./ban_list";
import { normalizeTimestamp } from "./utils";

/**
 * Pull all polymarket users from the subgraph
 * @param timestamp - get all users before this timestamp
 */
export const getAllUsers = async (
    timestamp: number,
    excludedAccounts?: string[],
): Promise<string[]> => {
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
            const users: string[] = [];
            console.log(`Pulling all users from subgraph...`);
            const search = true;

            const timestampInSeconds = normalizeTimestamp(timestamp);
            if (!excludedAccounts) {
                excludedAccounts = EXCLUDED_ACCOUNTS;
            }
            while (search) {
                //Subgraph can only pull 1k accounts at a time,
                //queries the subgraph until all users are pulled
                const { data } = await queryGqlClient(
                    queries.getAllUsersQuery,
                    {
                        lastId: lastId,
                        timestamp: `${timestampInSeconds}`,
                        excluded: excludedAccounts,
                    },
                );

                if (data.accounts.length === 0) {
                    break;
                }

                for (const account of data.accounts) {
                    //each account that is added must have added liquidity or traded in the past
                    if (
                        account.transactions.length > 0 ||
                        account.fpmmPoolMemberships.length > 0
                    ) {
                        users.push(account.id);
                    }
                }
                lastId = data.accounts[data.accounts.length - 1].id;
            }
            console.log(`Found ${users.length} users!`);
            return users;
        } catch (err) {
            console.log(
                "\n",
                "timestamp",
                timestamp,
                "excludedAccounts",
                excludedAccounts,
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
        "\n\n\n\n\n\ngetAllUsers-Retry count exceeded",
        "timestamp",
        timestamp,
        "excludedAccounts",
        excludedAccounts,
        "\n\n\n\n\n\n",
    );
};
