// GENERAL HELPERS

import { MapOfCount, UserAmount, UserRewardForStrapi } from "./interfaces";
import { getEoaLinkAddress } from "./eoa";
import {
  NewFormat,
  parseBalanceMap,
} from "../../merkle-distributor/src/parse-balance-map";
import { IsClaimed } from "../../sdk/types";
import { BigNumber } from "@ethersproject/bignumber";
import { MerkleDistributorInfo } from "../../merkle-distributor/src/parse-balance-map";

// VARIABLES
export const SCALE_FACTOR = Math.pow(10, 6);
export const DECIMALS = 6;

const now = Date.now();
export const ONE_DAY_AGO = now - 86400000;
export const TWO_DAYS_AGO = now - 172800000;
export const FOUR_DAYS_AGO = now - 345600000;
export const EIGHT_DAYS_AGO = now - 691200000;

/**
 * Sums liquidity of a given block
 * @param block
 * @returns the sum of all block values
 */
export const sumValues = (block: MapOfCount): number => {
  const allLiquidity: number[] = Object.values(block);
  return allLiquidity.reduce((acc, current) => {
    return acc + current;
  }, 0);
};

/**
 * Returns an array of userAmounts from 10^6 if coming from Subgraph
 * @param userAmounts
 * @returns userAmounts
 */
export const cleanUserAmounts = (userAmounts: UserAmount[]): UserAmount[] => {
  return userAmounts.map(({ user, amount }) => {
    return {
      user,
      amount:
        typeof amount === "number"
          ? amount / SCALE_FACTOR
          : parseInt(amount) / SCALE_FACTOR,
    };
  });
};

/**
 * Makes a points map from userAmounts where key is address and value is number
 * @param userAmounts
 * @returns mapOfCount
 */
export const makePointsMap = (userAmounts: UserAmount[]): MapOfCount => {
  return userAmounts.reduce<MapOfCount>((acc, curr) => {
    if (!acc[curr.user]) {
      acc[curr.user] = 0;
    }
    acc[curr.user] += curr.amount;
    return acc;
  }, {});
};

/**
 * Makes a payouts map given a points map, total points and token supply
 * @param pointsMap
 * @param totalPoints
 * @param supply
 * @returns mapOfCount
 */
export const makePayoutsMap = (
  pointsMap: MapOfCount,
  totalPoints: number,
  supply: number
): MapOfCount => {
  return Object.keys(pointsMap).reduce((acc, user) => {
    if (!acc[user]) {
      acc[user] = 0;
    }
    const percentOfTotalFees = pointsMap[user] / totalPoints;
    acc[user] = percentOfTotalFees * supply;
    return acc;
  }, {});
};

/**
 * Combines an array maps where the key is an address and value is number of points/payout amounts
 * @param arrayOfMaps (mapOfCount[])
 * @returns mapOfCount
 */
export const combineMaps = (arrayOfMaps: MapOfCount[]): MapOfCount => {
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

/**
 * Takes in a payout/points map, returns proxy wallet + eoa wallet + amount.
 * @param map where key is address and value is amount (string or number)
 * @returns proxyWallet, eoaWallet, amount
 */
export const addEoaToUserPayoutMap = async <T extends string | number>(map: {
  [account: string]: T;
}): Promise<{ proxyWallet: string; eoaWallet: string; amount: T }[]> => {
  // Return an array with address, EOA and amount
  return Promise.all(
    Object.keys(map).map(async (userAddress) => {
      const eoaWallet = await getEoaLinkAddress(userAddress);
      return {
        proxyWallet: userAddress,
        amount: map[userAddress] as T,
        eoaWallet: eoaWallet,
      };
    })
  );
};

/**
 * Removes keys from map where value is 0 or negative
 * @param mapOfCount
 * @returns addresses with positive values
 */
const positiveAddressesOnly = (map) =>
  Object.keys(map).filter((key) => map[key] > 0);

/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns OldFormat from parseBalanceMap
 * @returns todo - update cleanNumber
 */
export const normalizeMapAmounts = (
  map: MapOfCount
): { [account: string]: number } => {
  return positiveAddressesOnly(map).reduce((acc, curr) => {
    if (!acc[curr]) {
      acc[curr] = cleanNumber(map[curr]);
    }
    return acc;
  }, {});
};

/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns NewFormat[] from parseBalanceMap
 * @returns todo - cleanNumber
 */
export const normalizeEarningsFewFormat = (map: MapOfCount): NewFormat[] => {
  return positiveAddressesOnly(map).reduce((acc, curr) => {
    acc.push({
      address: curr,
      earnings: cleanNumber(map[curr]),
      reasons: "",
    });
    return acc;
  }, []);
};

/**
 * Takes in a float
 * @param number
 * @returns the float's ceiling, an integer - todo
 */
export const cleanNumber = (number: number): number => {
  return Math.ceil(number);

  // todo - figure out this
  //   const string = number.toString();
  //   const [int, dec] = string.split(".");
  //   const minDecimals = dec.padEnd(DECIMALS, "0");
  //   const onlyDecimals = minDecimals.slice(0, DECIMALS);
  //   return int === "0" ? onlyDecimals : `${int}${onlyDecimals}`;
};

/**
 * Takes in a isClaimed array from the sdk, filters out claimed amounts,
 * combines with a new payout map and returns the new merkle claims + root
 * @param prevClaims
 * @param mapOfCount
 * @returns merkleDistributorInfo
 */
export const combineMerkleInfo = (
  prevClaims: IsClaimed[],
  newClaimMap: MapOfCount
): MerkleDistributorInfo => {
  const mapOfUnpaidClaims: MapOfCount = prevClaims
    .filter((c) => !c.isClaimed)
    .reduce((acc, curr) => {
      if (!acc[curr.address]) {
        const bn = BigNumber.from(curr.amount);
        acc[curr.address] = bn.toNumber();
        // todo
        // acc[curr.address] = whatever cleanNumber needs
      }
      return acc;
    }, {});

  const combined = combineMaps([newClaimMap, mapOfUnpaidClaims]);
  const normalized = normalizeEarningsFewFormat(combined);
  return parseBalanceMap(normalized);
};

export const formatClaimsForStrapi = (
  merkleInfo: MerkleDistributorInfo,
  epoch: number
): UserRewardForStrapi[] => {
  return Object.keys(merkleInfo.claims).map((username) => {
    return {
      username,
      epoch,
      ...merkleInfo.claims[username],
    };
  });
};
