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
  excludedAccounts?: string[]
): Promise<string[]> => {
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
    const { data } = await queryGqlClient(queries.getAllUsersQuery, {
      lastId: lastId,
      timestamp: `${timestampInSeconds}`,
      excluded: excludedAccounts,
    });

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
};
