import { MapOfCount } from "./interfaces";
import { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, METABASEUSER, METABASEPASSWORD } from "./constants";
import * as pg from 'node-postgres'
import fetch from "cross-fetch";
import { queryGqlClient } from "./gql_client";
import { UserAmount } from "./interfaces";
import {
  sumValues,
  makePointsMap,
  makePayoutsMap,
  cleanUserAmounts,
} from "./helpers";
import { EXCLUDED_ACCOUNT_MAP } from "./ban_list";
import request from 'request';
import { responsePathAsArray } from "graphql";
import { RewardEpochFromStrapi } from "./lp-helpers";
import { strict } from "yargs";

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
        statement_timeout: 10000
      })
    return client;
}
// export const testfunc = async (mystring: string): Promise<string> => {
//   return mystring;
// }

export const getToken = async (USERNAME: string, PASSWORD: string): Promise<string> => {
  let returnVar = '';
  await fetch('https://data.polymarket.io/api/session', {
    method: 'POST',
    body: JSON.stringify({
      "username": USERNAME,
      "password": PASSWORD
    }),
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'metabase.DEVICE=f7736e9c-c1b5-4a06-860d-a989cf1f7f1e; metabase.SESSION=fd0b9744-9b50-41ec-8182-fcc8780d9bc4'
    }
  }).then((response) => response.json())
  //Then with the data from the response in JSON...
  .then((data) => {
    returnVar = String(data.id);
  })
  //Then with the error genereted...
  .catch((error) => {
    console.error('Error:', error);
    return "error";
  });
  return returnVar;
}

export const getData = async (query: any): Promise<Map<string, number>> => {
  const token = await getToken(METABASEUSER, METABASEPASSWORD);
  const mapAccountsFees = new Map<string, number>();
  await fetch('https://data.polymarket.io/api/dataset', {
    method: 'POST',
    body: JSON.stringify(query),
    headers: {
      'Content-Type': 'application/json',
      'X-Metabase-Session': String(token),
    }
  }).then((response) => response.json())
  //Then with the data from the response in JSON...
  .then((data) => {
    const arrayFees = data.data.rows;
    arrayFees.forEach(arr => {
      mapAccountsFees.set(arr[1], arr[2]);
    })
    //console.log(data.data.rows);
  })
  //Then with the error genereted...
  .catch((error) => {
    console.error('Error:', error);
  })
  console.log(mapAccountsFees.entries())
  return mapAccountsFees;
}

export const getFeesSnapshot2 = async (epoch: RewardEpochFromStrapi, feeTokenSupply: number): Promise<MapOfCount> => {
  const max_avg_price = 0.98;
  const fullQuery = `with avg_price_tbl AS (SELECT CAST("tradeAmount" AS FLOAT)/CAST("outcomeTokensAmount" AS FLOAT) AS "avg_price", * FROM "Transactions"
  WHERE "timestamp" >= '${epoch.start}' AND "timestamp" <= '${epoch.end}' AND "outcomeTokensAmount" > 0
  ), sub_tbl AS (
  SELECT ROW_NUMBER() OVER(ORDER BY "account" ASC) AS "row", "account", SUM("feeAmount")/10^6 AS "totalFeeAmount" FROM "avg_price_tbl"
  WHERE "avg_price" <=${max_avg_price}
  GROUP BY "account"
  ORDER BY "totalFeeAmount" DESC)
  SELECT * FROM "sub_tbl"`
  const queryDict = {
    "database": 3,
    "type": "native",
    "native": {
      "query" : fullQuery
    }
  }
  const mapAccountsFees = await getData(queryDict);
  const fees = await getSQLFees(mapAccountsFees);
  const feeMap = await generateSQLFeesSnapshot(fees, feeTokenSupply);
  return feeMap;

}



export const doQuery = async (query: string, client: pg.Client): Promise<Map<string, number>> => {
  const mapAccountsFees = new Map<string, number>();
  await client.query(query).then(
    res => {
      const data = res.rows;
      console.log("done")
      data.forEach(row => {
        mapAccountsFees.set(row.account, row.totalFeeAmount);
        //console.log(`Account: ${row.account} Fee Amount: ${row.totalFeeAmount}`);
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

//1st function:

export const getFeesSnapshot = async (epoch: RewardEpochFromStrapi, feeTokenSupply: number): Promise<MapOfCount> => {
  const client = getClient(PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD);
  await client.connect()
  .then(() => console.log('connected'))
  .catch(err => console.error('connection error', err.stack))
  let mapAccountsFees = new Map<string, number>();
  const sampleSize = 50;
  const max_avg_price = 0.98;
  const max_num_traders = 450;
  for (let i = 0; i < max_num_traders/sampleSize; i++) {
      console.log(i);
      const query = `with avg_price_tbl AS (SELECT CAST("tradeAmount" AS FLOAT)/CAST("outcomeTokensAmount" AS FLOAT) AS "avg_price", * FROM "Transactions"
      WHERE "timestamp" >= '${epoch.start}' AND "timestamp" <= '${epoch.end}' AND "outcomeTokensAmount" > 0
      ), sub_tbl AS (
      SELECT ROW_NUMBER() OVER(ORDER BY "account" ASC) AS "row", "account", SUM("feeAmount")/10^6 AS "totalFeeAmount" FROM "avg_price_tbl"
      WHERE "avg_price" <=${max_avg_price}
      GROUP BY "account"
      ORDER BY "totalFeeAmount" DESC)
      SELECT * FROM "sub_tbl" 
      WHERE "row" >= ${i * sampleSize} AND "row" < ${(i+1) * sampleSize}`
      const mapAccountsFeesTemp = await doQuery(query, client);
      mapAccountsFees = new Map([...mapAccountsFees, ...mapAccountsFeesTemp])
      await new Promise(r => setTimeout(r, 2000));
  }
  client.end();
  console.log("fee token supply number", feeTokenSupply);
  const fees = await getSQLFees(mapAccountsFees);
  const feeMap = await generateSQLFeesSnapshot(fees, feeTokenSupply);
  return feeMap;
}