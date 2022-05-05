"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeesSnapshot = exports.generateSQLFeesSnapshot = exports.getSQLFees = exports.getData = exports.getToken = void 0;
const constants_1 = require("./constants");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const helpers_1 = require("./helpers");
const ban_list_1 = require("./ban_list");
const getToken = async (USERNAME, PASSWORD) => {
    let returnVar = '';
    await cross_fetch_1.default('https://data.polymarket.io/api/session', {
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
        .then((data) => {
        returnVar = String(data.id);
    })
        .catch((error) => {
        console.error('Error:', error);
        return "error";
    });
    return returnVar;
};
exports.getToken = getToken;
const getData = async (query) => {
    const token = await exports.getToken(constants_1.METABASEUSER, constants_1.METABASEPASSWORD);
    const mapAccountsFees = new Map();
    await cross_fetch_1.default('https://data.polymarket.io/api/dataset', {
        method: 'POST',
        body: JSON.stringify(query),
        headers: {
            'Content-Type': 'application/json',
            'X-Metabase-Session': String(token),
        }
    }).then((response) => response.json())
        .then((data) => {
        const arrayFees = data.data.rows;
        arrayFees.forEach(arr => {
            mapAccountsFees.set(arr[0], arr[1]);
        });
    })
        .catch((error) => {
        console.error('Error:', error);
    });
    return mapAccountsFees;
};
exports.getData = getData;
async function getSQLFees(mapOfAmounts) {
    const userAmounts = [];
    for (const [key, value] of mapOfAmounts.entries()) {
        userAmounts.push({
            user: key,
            amount: value,
        });
    }
    return userAmounts;
}
exports.getSQLFees = getSQLFees;
async function generateSQLFeesSnapshot(dataFromSQL, tokensPerEpoch) {
    const cleanedUserAmounts = helpers_1.cleanUserAmounts(dataFromSQL, ban_list_1.EXCLUDED_ACCOUNT_MAP);
    const pointsMap = helpers_1.makePointsMap(cleanedUserAmounts);
    const feeSum = helpers_1.sumValues(pointsMap);
    const payoutMap = helpers_1.makePayoutsMap(pointsMap, feeSum, tokensPerEpoch);
    return payoutMap;
}
exports.generateSQLFeesSnapshot = generateSQLFeesSnapshot;
const getFeesSnapshot = async (epoch, feeTokenSupply) => {
    const max_avg_price = 0.98;
    const fullQuery = `WITH avg_price_tbl AS
  (
         SELECT Cast("tradeAmount" AS FLOAT)/Cast("outcomeTokensAmount" AS FLOAT) AS "avg_price",
                                            *
         FROM   "Transactions"
         WHERE  "timestamp" >= '${epoch.start}'
         AND    "timestamp" <= '${epoch.end}'
         AND    "outcomeTokensAmount" > 0 ), sub_tbl AS
  (
           SELECT   "account",
                    SUM("feeAmount")/10^6 AS "totalFeeAmount"
           FROM     "avg_price_tbl"
           WHERE    "avg_price" <= 0.98
           GROUP BY "account"
           ORDER BY "totalFeeAmount" DESC), interval_tbl AS
  (
           SELECT   *,
                    extract(hour FROM (interval '1 second' * floor((extract('epoch' FROM "timestamp") - extract(epoch FROM timestamp '${epoch.start}')) / 86400) * 86400))/24 AS "day"
           FROM     "avg_price_tbl"
           ORDER BY "timestamp" DESC ), group_interval_tbl AS
  (
           SELECT   "account",
                    "day",
                    SUM("feeAmount")/10^6 AS "totalFeeAmount"
           FROM     "interval_tbl"
           WHERE    "avg_price" <= ${max_avg_price}
           GROUP BY "account",
                    "day"
           ORDER BY "account",
                    "totalFeeAmount" DESC ), proportion_tbl AS
  (
         SELECT                 *,
                "totalFeeAmount"/(SUM("totalFeeAmount") over (PARTITION BY day)) AS "proportion"
         FROM   "group_interval_tbl" ), total_account_prop_tbl AS
  (
           SELECT   "account",
                    SUM("proportion") AS "proportion_fees"
           FROM     "proportion_tbl"
           GROUP BY "account" )
  SELECT   "account",
           SUM("proportion")*10000 AS "totalFeeAmount"
  FROM     "proportion_tbl"
  GROUP BY "account"`;
    const queryDict = {
        "database": 3,
        "type": "native",
        "native": {
            "query": fullQuery
        }
    };
    const mapAccountsFees = await exports.getData(queryDict);
    const fees = await getSQLFees(mapAccountsFees);
    const feeMap = await generateSQLFeesSnapshot(fees, feeTokenSupply);
    return feeMap;
};
exports.getFeesSnapshot = getFeesSnapshot;
