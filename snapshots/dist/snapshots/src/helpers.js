"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hijackAddressForTesting = exports.combineMerkleInfo = exports.normalizeMapForMultipleEpochs = exports.combineBigNumberMaps = exports.normalizeEarningsNewFormat = exports.getAmountInEther = exports.validateAddress = exports.formatEstimatedRewards = exports.formatClaimsForStrapi = exports.addEoaToUserPayoutMap = exports.combineMaps = exports.makePayoutsMap = exports.makePointsMap = exports.cleanUserAmounts = exports.sumValues = exports.EIGHT_DAYS_AGO = exports.FOUR_DAYS_AGO = exports.TWO_DAYS_AGO = exports.ONE_DAY_AGO = void 0;
const eoa_1 = require("./eoa");
const parse_balance_map_1 = require("../../merkle-distributor/src/parse-balance-map");
const bignumber_1 = require("@ethersproject/bignumber");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
// VARIABLES
const GRAPH_SCALE_FACTOR = Math.pow(10, 6);
const now = Date.now();
exports.ONE_DAY_AGO = now - 86400000;
exports.TWO_DAYS_AGO = now - 172800000;
exports.FOUR_DAYS_AGO = now - 345600000;
exports.EIGHT_DAYS_AGO = now - 691200000;
/**
 * Sums liquidity of a given block
 * @param block
 * @returns the sum of all block values
 */
const sumValues = (block) => {
    const allLiquidity = Object.values(block);
    return allLiquidity.reduce((acc, current) => {
        return acc + current;
    }, 0);
};
exports.sumValues = sumValues;
/**
 * Returns an array of userAmounts from 10^6 if coming from Subgraph
 * @param userAmounts
 * @returns userAmounts
 */
const cleanUserAmounts = (userAmounts, banMap) => {
    return userAmounts
        .filter(({ user }) => {
        // console.log('user', user)
        if (banMap[user.toLowerCase()]) {
            return false;
        }
        return true;
    })
        .map(({ user, amount }) => {
        return {
            user,
            amount: typeof amount === "number"
                ? amount / GRAPH_SCALE_FACTOR
                : parseInt(amount) / GRAPH_SCALE_FACTOR,
        };
    });
};
exports.cleanUserAmounts = cleanUserAmounts;
/**
 * Makes a points map from userAmounts where key is address and value is number
 * @param userAmounts
 * @returns mapOfCount
 */
const makePointsMap = (userAmounts) => {
    return userAmounts.reduce((acc, curr) => {
        const address = curr.user;
        if (!acc[address]) {
            acc[address] = 0;
        }
        acc[address] += curr.amount;
        return acc;
    }, {});
};
exports.makePointsMap = makePointsMap;
/**
 * Makes a payouts map given a points map, total points and token supply
 * @param pointsMap
 * @param totalPoints
 * @param supply
 * @returns mapOfCount
 */
const makePayoutsMap = (pointsMap, totalPoints, supply) => {
    return Object.keys(pointsMap).reduce((acc, user) => {
        if (!acc[user]) {
            acc[user] = 0;
        }
        const percentOfTotalFees = pointsMap[user] / totalPoints;
        acc[user] = percentOfTotalFees * supply;
        return acc;
    }, {});
};
exports.makePayoutsMap = makePayoutsMap;
/**
 * Combines an array maps where the key is an address and value is number of points/payout amounts
 * @param arrayOfMaps (mapOfCount[])
 * @returns mapOfCount
 */
const combineMaps = (arrayOfMaps) => {
    const newMap = {};
    for (const oldMap of arrayOfMaps) {
        for (const user of Object.keys(oldMap)) {
            if (!newMap[user]) {
                newMap[user] = 0;
            }
            newMap[user] = newMap[user] + oldMap[user];
        }
    }
    return newMap;
};
exports.combineMaps = combineMaps;
/**
 * Takes in a payout/points map, returns proxy wallet + eoa wallet + amount.
 * @param map where key is address and value is amount (string or number)
 * @returns proxyWallet, eoaWallet, amount
 */
const addEoaToUserPayoutMap = async (map) => {
    // Return an array with address, EOA and amount
    return Promise.all(Object.keys(map).map(async (userAddress) => {
        const eoaWallet = await eoa_1.getEoaLinkAddress(userAddress);
        return {
            proxyWallet: userAddress,
            amount: map[userAddress],
            eoaWallet: eoaWallet,
        };
    }));
};
exports.addEoaToUserPayoutMap = addEoaToUserPayoutMap;
/**
 * Takes in claims from merkle info and addsl epoch for strapi user rewards
 * @param merkleInfo merkleInfo with claims array
 * @param epoch which epoch
 */
const formatClaimsForStrapi = (merkleInfo, epoch, tokenId) => {
    return Object.keys(merkleInfo.claims).map((username) => {
        return Object.assign({ username,
            epoch, reward_token: tokenId }, merkleInfo.claims[username]);
    });
};
exports.formatClaimsForStrapi = formatClaimsForStrapi;
/**
 * Formats a liquidity map for estimated rewards for strapi
 * @param mapOfCount liquidity map
 * @param epoch which epoch
 * @param epoch reward_token id
 * @param isUSDC for scaling
 */
const formatEstimatedRewards = (map, epoch, reward_token, isUSDC) => {
    return positiveAddressesOnly(map).map((username) => {
        return {
            username: exports.validateAddress(username),
            epoch,
            reward_token,
            estimated_liq: exports.getAmountInEther(map[username], isUSDC).toHexString(),
        };
    });
};
exports.formatEstimatedRewards = formatEstimatedRewards;
/**
 * Removes keys from map where value is 0 or negative
 * @param mapOfCount
 * @returns addresses with positive values
 */
const positiveAddressesOnly = (map) => Object.keys(map).filter((key) => map[key] > 0);
/**
 * Makes sure the address is valid and then formats it correctly
 * @param address string
 */
const validateAddress = (address) => {
    if (!utils_1.isAddress(address)) {
        throw new Error("Invalid address");
    }
    return utils_1.getAddress(address);
};
exports.validateAddress = validateAddress;
/**
 * Trims and Lowercases a string
 * @param address
 * @returns
 */
const trimAndLowerCaseAddress = (address) => {
    return address.trim().toLowerCase();
};
/**
 * Takes in a float
 * @param number
 * @returns
 */
const getAmountInEther = (number, isUSDC) => {
    let n = number.toString();
    if (n.includes("e")) {
        n = new Number(number).toFixed(17); // toFixed loses precision, only use when number is in scientific notation
    }
    else {
        n = n.slice(0, 17);
    }
    return isUSDC
        ? ethers_1.ethers.utils.parseEther(n).div(bignumber_1.BigNumber.from(10).pow(12))
        : ethers_1.ethers.utils.parseEther(n);
};
exports.getAmountInEther = getAmountInEther;
/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns NewFormat[] from parseBalanceMap
 * @returns todo - getAmountInEther
 */
const normalizeEarningsNewFormat = (map, isUSDC) => {
    return positiveAddressesOnly(map)
        .map((addr) => {
        return {
            address: exports.validateAddress(addr),
            earnings: bignumber_1.BigNumber.isBigNumber(map[addr])
                ? map[addr].toString()
                : exports.getAmountInEther(map[addr], isUSDC).toString(),
            reasons: "",
        };
    })
        .filter((pos) => {
        return bignumber_1.BigNumber.from(pos.earnings).gt(0);
    });
};
exports.normalizeEarningsNewFormat = normalizeEarningsNewFormat;
/**
 * Combines an array maps where the key is an address and value is number of points/payout amounts
 * @param arrayOfMaps (mapOfCount[])
 * @returns mapOfCount
 */
const combineBigNumberMaps = (arrayOfMaps) => {
    const newMap = {};
    for (const oldMap of arrayOfMaps) {
        for (const user of Object.keys(oldMap)) {
            if (!newMap[user]) {
                newMap[user] = bignumber_1.BigNumber.from("0");
            }
            newMap[user] = newMap[user].add(oldMap[user]);
        }
    }
    return newMap;
};
exports.combineBigNumberMaps = combineBigNumberMaps;
/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns OldFormat from parseBalanceMap
 * @returns todo - update getAmountInEther
 */
const normalizeMapForMultipleEpochs = (map, isUSDC) => {
    return positiveAddressesOnly(map).reduce((acc, curr) => {
        const lowerCase = trimAndLowerCaseAddress(curr);
        if (!acc[lowerCase]) {
            acc[lowerCase] = exports.getAmountInEther(map[curr], isUSDC);
        }
        return acc;
    }, {});
};
exports.normalizeMapForMultipleEpochs = normalizeMapForMultipleEpochs;
/**
 * Takes in a isClaimed array from the sdk, filters out claimed amounts,
 * combines with a new payout map and returns the new merkle claims + root
 * @param prevClaims
 * @param newClaimMap
 * @param isUSDC
 * @returns merkleDistributorInfo
 */
const combineMerkleInfo = (prevClaims, newClaimMap, isUSDC) => {
    const mapOfUnpaidClaims = prevClaims
        .filter((c) => !c.isClaimed)
        .reduce((acc, curr) => {
        const address = trimAndLowerCaseAddress(curr.address);
        if (!acc[address]) {
            acc[address] = bignumber_1.BigNumber.from(curr.amount);
        }
        return acc;
    }, {});
    const newMap = exports.normalizeMapForMultipleEpochs(newClaimMap, isUSDC);
    const combined = exports.combineBigNumberMaps([newMap, mapOfUnpaidClaims]);
    const normalized = exports.normalizeEarningsNewFormat(combined, isUSDC);
    return parse_balance_map_1.parseBalanceMap(normalized);
};
exports.combineMerkleInfo = combineMerkleInfo;
const hijackAddressForTesting = (map, pirateAddress) => {
    const addressToHijack = Object.keys(map)
        .sort((a, b) => map[b] - map[a])
        .find((address) => map[address]);
    const largestAmount = map[addressToHijack];
    delete map[addressToHijack];
    return Object.assign(Object.assign({}, map), { [pirateAddress]: largestAmount });
};
exports.hijackAddressForTesting = hijackAddressForTesting;
