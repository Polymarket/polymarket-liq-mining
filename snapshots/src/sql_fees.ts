import { MapOfCount } from "./interfaces";
import { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } from "./constants";
import * as pg from 'node-postgres'
import { queryGqlClient } from "./gql_client";
import { UserAmount } from "./interfaces";
import {
  sumValues,
  makePointsMap,
  makePayoutsMap,
  cleanUserAmounts,
} from "./helpers";
import { EXCLUDED_ACCOUNT_MAP } from "./ban_list";

//Store the .env variables
//import the .env variables to connect to DB
//use file called constants.ts
//First function to connect to DB, return connection to DB that allows queries to be made on
//Second function to use either node-postgres or knex to execute the query on the connection
//
// export const cleanData = (dataFromSQL: any): MapOfCount => {

// }

export const getClient = (PGHOST: string, PGPORT: string, PGDATABASE: string, PGUSER: string, PGPASSWORD: string): pg.Client => {
    const { Client } = pg
    const client = new Client({
        user: PGUSER,
        host: PGHOST,
        database: PGDATABASE,
        password: PGPASSWORD,
        port: Number(PGPORT),
      })
    return client;
}

export const doQuery = async (query: string, client: pg.Client): Promise<Map<string, number>> => {
  const mapAccountsFees = new Map<string, number>();
  await client.query(query).then(
    res => {
      const data = res.rows;
      console.log("done")
      data.forEach(row => {
        mapAccountsFees.set(row.account, row.totalFeeAmount);
        console.log(`Account: ${row.account} Fee Amount: ${row.totalFeeAmount}`);
      })
    })
  .catch(e => console.error(e.stack))
  return mapAccountsFees;
}


export async function getSQLFees(mapOfAmounts: Map<string, number>): Promise<UserAmount[]>  {
  const userAmounts = [];
  for (const [key, value] of mapOfAmounts.entries()) {
    userAmounts.push({
      user: key,
      amount: value,
    })
  }
  return userAmounts;
}

export async function generateSQLFeesSnapshot(dataFromSQL: UserAmount[], tokensPerEpoch: number): Promise<MapOfCount> {
    const cleanedUserAmounts = cleanUserAmounts(dataFromSQL, EXCLUDED_ACCOUNT_MAP);
    const pointsMap = makePointsMap(cleanedUserAmounts);
    const feeSum = sumValues(pointsMap);
    const payoutMap = makePayoutsMap(pointsMap, feeSum, tokensPerEpoch);
    return payoutMap;
}