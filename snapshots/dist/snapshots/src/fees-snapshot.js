"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFeesSnapshot = void 0;
const fees_1 = require("./fees");
const helpers_1 = require("./helpers");
const ban_list_1 = require("./ban_list");
async function generateFeesSnapshot(startTimestamp, endTimestamp, tokensPerEpoch) {
    console.log(`Generating fees snapshot from timestamp ${new Date(startTimestamp).toString()} to ${new Date(endTimestamp).toString()}: `);
    console.log(`Total Token Supply for Fees: ${tokensPerEpoch} tokens`);
    const fees = await fees_1.getAllFeesInEpoch(startTimestamp, endTimestamp);
    const cleanedUserAmounts = helpers_1.cleanUserAmounts(fees, ban_list_1.EXCLUDED_ACCOUNT_MAP);
    const pointsMap = helpers_1.makePointsMap(cleanedUserAmounts);
    const feeSum = helpers_1.sumValues(pointsMap);
    const payoutMap = helpers_1.makePayoutsMap(pointsMap, feeSum, tokensPerEpoch);
    return payoutMap;
}
exports.generateFeesSnapshot = generateFeesSnapshot;
