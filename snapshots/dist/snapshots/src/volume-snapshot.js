"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVolumeSnapshot = void 0;
const eoa_1 = require("./eoa");
const trade_volume_1 = require("./trade-volume");
const users_1 = require("./users");
const snapshot = [];
async function generateVolumeSnapshot(timestamp, supply) {
    console.log(`Generating volume weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    // get all users
    const users = await users_1.getAllUsers(timestamp);
    //get volume per user at the timestamp
    console.log(`Fetching trade volume per user at snapshot...`);
    const tradeVolumes = await trade_volume_1.getTradeVolume(users, timestamp);
    // get total volume
    const totalTradeVolume = tradeVolumes.reduce(function (prev, current) {
        return prev + current;
    }, 0);
    console.log(`Complete! Total trade volume: ${totalTradeVolume}!`);
    for (const userIndex in users) {
        const user = users[userIndex];
        const userVolume = tradeVolumes[userIndex];
        if (userVolume > 0) {
            const airdropAmount = (userVolume / totalTradeVolume) * supply;
            const eoa = await eoa_1.fetchEoaAddress(user);
            snapshot.push({ proxyWallet: user, eoaWallet: eoa, amount: airdropAmount });
        }
    }
    return snapshot;
}
exports.generateVolumeSnapshot = generateVolumeSnapshot;
