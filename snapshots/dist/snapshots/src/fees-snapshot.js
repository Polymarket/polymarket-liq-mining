"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFeesSnapshot = void 0;
const fees_1 = require("./fees");
const helpers_1 = require("./helpers");
const ban_list_1 = require("./ban_list");
async function generateFeesSnapshot(startTimestamp, endTimestamp, tokensPerEpoch) {
    console.log(`Generating fees snapshot from timestamp ${new Date(startTimestamp).toString()} to ${new Date(endTimestamp).toString()}: `);
    console.log(`Total Token Supply for Fees: ${tokensPerEpoch} tokens`);
    const fees = await (0, fees_1.getAllFeesInEpoch)(startTimestamp, endTimestamp);
    const cleanedUserAmounts = (0, helpers_1.cleanUserAmounts)(fees, ban_list_1.EXCLUDED_ACCOUNT_MAP);
    const pointsMap = (0, helpers_1.makePointsMap)(cleanedUserAmounts);
    const feeSum = (0, helpers_1.sumValues)(pointsMap);
    const payoutMap = (0, helpers_1.makePayoutsMap)(pointsMap, feeSum, tokensPerEpoch);
    return payoutMap;
}
exports.generateFeesSnapshot = generateFeesSnapshot;
