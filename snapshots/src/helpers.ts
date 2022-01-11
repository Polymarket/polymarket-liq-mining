// GENERAL HELPERS

import { MapOfCount, UserAmount, UserRewardForStrapi } from "./interfaces";
import { getEoaLinkAddress } from "./eoa";
import {
  NewFormat,
  parseBalanceMap,
} from "../../merkle-distributor/src/parse-balance-map";
import { IsClaimed } from "../../sdk/src/types";
import { BigNumber } from "@ethersproject/bignumber";
import { MerkleDistributorInfo } from "../../merkle-distributor/src/parse-balance-map";
import { ethers } from "ethers";
import { getAddress, isAddress } from "ethers/lib/utils";

// VARIABLES
const GRAPH_SCALE_FACTOR = Math.pow(10, 6);

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
    const address = validateAddress(user);
    return {
      user: address,
      amount:
        typeof amount === "number"
          ? amount / GRAPH_SCALE_FACTOR
          : parseInt(amount) / GRAPH_SCALE_FACTOR,
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
    const address = validateAddress(curr.user);
    if (!acc[address]) {
      acc[address] = 0;
    }
    acc[address] += curr.amount;
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
    const address = validateAddress(user);
    if (!acc[address]) {
      acc[address] = 0;
    }
    const percentOfTotalFees = pointsMap[address] / totalPoints;
    acc[address] = percentOfTotalFees * supply;
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
      const address = validateAddress(user);
      if (!newMap[address]) {
        newMap[address] = 0;
      }
      newMap[address] = newMap[address] + oldMap[address];
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
 * Takes in claims from merkle info and addsl epoch for strapi user rewards
 * @param merkleInfo merkleInfo with claims array
 * @param epoch which epoch
 */
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

/**
 * Removes keys from map where value is 0 or negative
 * @param mapOfCount
 * @returns addresses with positive values
 */
const positiveAddressesOnly = (map) =>
  Object.keys(map).filter((key) => map[key] > 0);

/**
 * Makes sure the address is valid and then formats it correctly
 * @param address string
 */
export const validateAddress = (address: string): string => {
  if (!isAddress(address)) {
    throw new Error("Invalid address");
  }
  return getAddress(address);
};

// --------------------------
// BIGNUMBER
// --------------------------

type BigNumberMapOfCount = { [address: string]: BigNumber };

/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns OldFormat from parseBalanceMap
 * @returns todo - update getAmountInEther
 */
export const normalizeMapAmounts = (map: MapOfCount): BigNumberMapOfCount => {
  return positiveAddressesOnly(map).reduce((acc, curr) => {
    const address = validateAddress(curr);
    if (!acc[address]) {
      acc[address] = getAmountInEther(map[address]);
    }
    return acc;
  }, {});
};

/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns NewFormat[] from parseBalanceMap
 * @returns todo - getAmountInEther
 */
export const normalizeEarningsNewFormat = (
  map: MapOfCount | BigNumberMapOfCount
): NewFormat[] => {
  return positiveAddressesOnly(map).map((addr) => {
    const address = validateAddress(addr);
    return {
      address: address,
      earnings: BigNumber.isBigNumber(map[address])
        ? map[address].toString()
        : getAmountInEther(map[address] as number).toString(),
      reasons: "",
    };
  });
};

/**
 * Combines an array maps where the key is an address and value is number of points/payout amounts
 * @param arrayOfMaps (mapOfCount[])
 * @returns mapOfCount
 */
export const combineBigNumberMaps = (
  arrayOfMaps: BigNumberMapOfCount[]
): BigNumberMapOfCount => {
  const newMap = {};

  for (const oldMap of arrayOfMaps) {
    for (const user of Object.keys(oldMap)) {
      const address = validateAddress(user);
      if (!newMap[address]) {
        newMap[address] = BigNumber.from("0");
      }
      newMap[address] = newMap[address].add(oldMap[address]);
    }
  }
  return newMap;
};

/**
 * Takes in a float
 * @param number
 * @returns
 */
export const getAmountInEther = (number: number): BigNumber => {
  const n = number.toString().slice(0, 17); // parseEther throws an error if decimals are longer than 18
  return ethers.utils.parseEther(n);
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
  const mapOfUnpaidClaims: BigNumberMapOfCount = prevClaims
    .filter((c) => !c.isClaimed)
    .reduce((acc, curr) => {
      const address = validateAddress(curr.address);
      if (!acc[address]) {
        acc[address] = BigNumber.from(curr.amount);
      }
      return acc;
    }, {});

  const newMap = normalizeMapAmounts(newClaimMap);
  const combined = combineBigNumberMaps([newMap, mapOfUnpaidClaims]);
  const normalized = normalizeEarningsNewFormat(combined);
  return parseBalanceMap(normalized);
};
