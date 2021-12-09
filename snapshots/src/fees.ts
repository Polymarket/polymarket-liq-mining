import * as queries from "./queries";
import { queryGqlClient } from "./gql_client";
// import { EXCLUDED_ACCOUNTS } from "./ban_list";
import { normalizeTimestamp } from "./utils";

/**
 * Pull all transactions from the subgraph in the last epoch
 * @param startTimestamp - get all tx after this timestamp
 * @param endTimestamp - get all tx before this timestamp
 */
export const getAllFeesInEpoch = async (
  startTimestamp: number,
  endTimestamp: number
): Promise<{ feeAmount: number; userId: string }[]> => {
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
      }
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
          userId: account.user.id,
          feeAmount: account.feeAmount,
        });
      }
    }
    lastId = data.transactions[data.transactions.length - 1].id;
  }
  console.log(`Found ${usersWithTransactions.length} transactions!`);
  return usersWithTransactions;
};
