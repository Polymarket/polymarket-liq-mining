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
import { RewardToken } from "./lp-helpers";

// VARIABLES
const GRAPH_SCALE_FACTOR = Math.pow(10, 6);

const now = Date.now();
export const ONE_DAY_AGO = now - 86400000;
export const TWO_DAYS_AGO = now - 172800000;
export const FOUR_DAYS_AGO = now - 345600000;
export const EIGHT_DAYS_AGO = now - 691200000;

// TYPES
type BigNumberMapOfCount = { [address: string]: BigNumber };
type BanMap = { [address:string]: boolean}

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
export const cleanUserAmounts = (userAmounts: UserAmount[], banMap: BanMap): UserAmount[] => {
  return userAmounts
    .filter(({user}) => {
		// console.log('user', user)
		if (banMap[user.toLowerCase()]) {
			return false
		}
		return true
	})
    .map(({ user, amount }) => {
      return {
        user,
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
    const address = curr.user;
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
 * Takes in claims from merkle info and addsl epoch for strapi user rewards
 * @param merkleInfo merkleInfo with claims array
 * @param epoch which epoch
 */
export const formatClaimsForStrapi = (
  merkleInfo: MerkleDistributorInfo,
  epoch: number,
  tokenId: RewardToken["id"]
): UserRewardForStrapi[] => {
  return Object.keys(merkleInfo.claims).map((username) => {
    return {
      username,
      epoch,
      reward_token: tokenId,
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

/**
 * Trims and Lowercases a string
 * @param address
 * @returns
 */
const trimAndLowerCaseAddress = (address: string): string => {
  return address.trim().toLowerCase();
};

/**
 * Takes in a float
 * @param number
 * @returns
 */
export const getAmountInEther = (number: number): BigNumber => {
  let n = number.toString().slice(0, 17); // parseEther throws an error if decimals are longer than 18

  if (n.includes("e")) {
    const eIndex = n.indexOf("e");
    n = n.slice(0, eIndex);
  }
  return ethers.utils.parseEther(n);
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
    return {
      address: validateAddress(addr), // NOTICE THE VALIDATE ADDRESS FROM ETHERS
      earnings: BigNumber.isBigNumber(map[addr])
        ? map[addr].toString()
        : getAmountInEther(map[addr] as number).toString(),
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
      if (!newMap[user]) {
        newMap[user] = BigNumber.from("0");
      }
      newMap[user] = newMap[user].add(oldMap[user]);
    }
  }
  return newMap;
};

/**
 * Takes in a map with address and number amount
 * @param mapOfCount
 * @returns OldFormat from parseBalanceMap
 * @returns todo - update getAmountInEther
 */
export const normalizeMapForMultipleEpochs = (
  map: MapOfCount
): BigNumberMapOfCount => {
  return positiveAddressesOnly(map).reduce((acc, curr) => {
    const lowerCase = trimAndLowerCaseAddress(curr);
    if (!acc[lowerCase]) {
      acc[lowerCase] = getAmountInEther(map[curr]);
    }
    return acc;
  }, {});
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
      const address = trimAndLowerCaseAddress(curr.address);
      if (!acc[address]) {
        acc[address] = BigNumber.from(curr.amount);
      }
      return acc;
    }, {});

  const newMap = normalizeMapForMultipleEpochs(newClaimMap);
  const combined = combineBigNumberMaps([newMap, mapOfUnpaidClaims]);
  const normalized = normalizeEarningsNewFormat(combined);
  return parseBalanceMap(normalized);
};

export const hijackAddressForTesting = (
  map: MapOfCount,
  pirateAddress: string
): MapOfCount => {
  const addressToHijack = Object.keys(map)
    .sort((a, b) => map[b] - map[a])
    .find((address) => map[address]);

  const largestAmount = map[addressToHijack];
  delete map[addressToHijack];

  return {
    ...map,
    [pirateAddress]: largestAmount,
  };
};
