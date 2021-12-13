// GENERAL HELPERS

import { MapOfCount, UserAmount } from "./interfaces";
import { getMagicLinkAddress } from "./magic";

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
 * @returns number
 */
export const sumValues = (block: MapOfCount): number => {
  const allLiquidity: number[] = Object.values(block);
  return allLiquidity.reduce((acc, current) => {
    return acc + current;
  }, 0);
};

/**
 * Creates a map of userAddress => true
 * @param arrayOfStrings
 * @returns map
 */
export const createStringMap = (
  arrayOfStrings: string[]
): { [key: string]: boolean } => {
  return arrayOfStrings
    .reduce((acc, curr) => {
      if (!acc[curr]) {
        acc[curr] = true;
      }
      return acc;
    }, {});
};

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

export const makePointsMap = (userAmounts: UserAmount[]): MapOfCount => {
  return userAmounts.reduce<MapOfCount>((acc, curr) => {
    if (!acc[curr.user]) {
      acc[curr.user] = 0;
    }
    acc[curr.user] += curr.amount;
    return acc;
  }, {});
};

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

export const addEoaToUserPayoutMap = async <T extends string | number>(map: {
  [account: string]: T;
}): Promise<{ proxyWallet: string; magicWallet: string; amount: T }[]> => {
  // Return an array with address, EOA and amount
  return Promise.all(
    Object.keys(map).map(async (userAddress) => {
      const magicWallet = await getMagicLinkAddress(userAddress);
      return {
        proxyWallet: userAddress,
        amount: map[userAddress] as T,
        magicWallet: magicWallet,
      };
    })
  );
};

export const normalizeMapAmounts = (
  map: MapOfCount
): { [account: string]: string } => {
  return Object.keys(map).reduce((acc, curr) => {
    if (!acc[curr]) {
      acc[curr] = cleanNumber(map[curr]);
    }
    return acc;
  }, {});
};

export const cleanNumber = (number: number): string => {
  const string = number.toString();
  const [int, dec] = string.split(".");
  const minDecimals = dec.padEnd(DECIMALS, "0");
  const onlyDecimals = minDecimals.slice(0, DECIMALS);
  if (int === "0") {
    return onlyDecimals;
  }
  return `${int}${onlyDecimals}`;
};
