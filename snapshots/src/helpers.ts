// GENERAL HELPERS

import { MapOfCount, UserAmount } from "./interfaces";
import { fetchMagicAddress } from "./magic";

// VARIABLES
export const SCALE_FACTOR = Math.pow(10, 6);

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
    .map((addr) => addr.toLowerCase())
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
      user: user.toLowerCase(),
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
    acc[user] = percentOfTotalFees / supply;
    return acc;
  }, {});
};

export const addEoaToUserMap = async (map: {
  [userAddres: string]: number;
}) => {
  // Return an array with address, EOA and amount
  return Promise.all(
    Object.keys(map).map(async (userAddress) => {
      const magicWallet = await fetchMagicAddress(userAddress);
      return {
        proxyWallet: userAddress,
        amount: map[userAddress],
        magicWallet: magicWallet,
      };
    })
  );
};
