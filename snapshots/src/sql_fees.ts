import { MapOfCount } from "./interfaces";
import { METABASEUSER, METABASEPASSWORD } from "./constants";
import fetch from "cross-fetch";
import { UserAmount } from "./interfaces";
import {
  sumValues,
  makePointsMap,
  makePayoutsMap,
  cleanUserAmounts,
} from "./helpers";
import { EXCLUDED_ACCOUNT_MAP } from "./ban_list";
import { RewardEpochFromStrapi } from "./lp-helpers";

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

export const getFeesSnapshot = async (epoch: RewardEpochFromStrapi, feeTokenSupply: number): Promise<MapOfCount> => {
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

export const getOldSnapshot = async (feeTokenSupply: number): Promise<MapOfCount> => {
  const max_avg_price = 0.98;
  const fullQuery = `with avg_price_tbl AS (SELECT CAST("tradeAmount" AS FLOAT)/CAST("outcomeTokensAmount" AS FLOAT) AS "avg_price", * FROM "Transactions"
  WHERE "timestamp" >= '2022-03-11 4:00:00' AND "timestamp" <= '2022-03-18 4:00:00' AND "outcomeTokensAmount" > 0
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

export const getNewSnapshot = async (feeTokenSupply: number): Promise<MapOfCount> => {
  const max_avg_price = 0.98;
  const fullQuery = `with avg_price_tbl AS (SELECT CAST("tradeAmount" AS FLOAT)/CAST("outcomeTokensAmount" AS FLOAT) AS "avg_price", * FROM "Transactions"
  WHERE "timestamp" >= '2022-03-18T16:00:00.000Z' AND "timestamp" <= '2022-03-25T16:00:00.000Z' AND "outcomeTokensAmount" > 0
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


export const getDifference = async (feeTokenSupply: number): Promise<MapOfCount> => {
  const oldSnapshot = await getOldSnapshot(feeTokenSupply);
  //console.log("oldSnapshot", oldSnapshot);
  const newSnapshot = await getNewSnapshot(feeTokenSupply);
  //console.log("newSnapshot", newSnapshot);
  const merged = Object.entries(oldSnapshot).reduce((acc, [key, value]) => 
  // if key is already in map1, add the values, otherwise, create new pair
  ({ ...acc, [key]: (acc[key] || 0) - value })
, { ...newSnapshot });
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === "number" && value < 0) {
        delete merged[key];
    }
  }
  return merged;
}

export const addToFeeMap = async (feeMap: MapOfCount, feeTokenSupply: number): Promise<MapOfCount> => {
  const difference = await getDifference(feeTokenSupply);
  //console.log("Difference", difference);
  const merged = Object.entries(feeMap).reduce((acc, [key, value]) => 
  // if key is already in map1, add the values, otherwise, create new pair
  ({ ...acc, [key]: (acc[key] || 0) + value })
, { ...difference });
  return merged;
}
