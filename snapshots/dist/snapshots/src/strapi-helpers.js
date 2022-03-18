"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRewardTokens = exports.fetchRewardEpochs = exports.fetchRewardEpochsCount = exports.fetchRewardMarketsCount = exports.fetchRewardUsersForEpoch = exports.fetchRewardUsersCount = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
async function fetchRewardUsersCount(STRAPI_URL) {
    const response = await cross_fetch_1.default(`${STRAPI_URL}/reward-users/count`);
    return await response.json();
}
exports.fetchRewardUsersCount = fetchRewardUsersCount;
async function fetchRewardUsersForEpoch(STRAPI_URL, epoch) {
    const response = await cross_fetch_1.default(`${STRAPI_URL}/reward-users?epoch=${epoch}`);
    return await response.json();
}
exports.fetchRewardUsersForEpoch = fetchRewardUsersForEpoch;
async function fetchRewardMarketsCount(STRAPI_URL) {
    const response = await cross_fetch_1.default(`${STRAPI_URL}/reward-markets/count`);
    return await response.json();
}
exports.fetchRewardMarketsCount = fetchRewardMarketsCount;
async function fetchRewardEpochsCount(STRAPI_URL) {
    const response = await cross_fetch_1.default(`${STRAPI_URL}/reward-epoches/count`);
    return await response.json();
}
exports.fetchRewardEpochsCount = fetchRewardEpochsCount;
async function fetchRewardEpochs(STRAPI_URL) {
    const response = await cross_fetch_1.default(`${STRAPI_URL}/reward-epoches`);
    return await response.json();
}
exports.fetchRewardEpochs = fetchRewardEpochs;
async function fetchRewardTokens(STRAPI_URL) {
    const response = await cross_fetch_1.default(`${STRAPI_URL}/reward-tokens`);
    return await response.json();
}
exports.fetchRewardTokens = fetchRewardTokens;
