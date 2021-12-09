// GENERAL HELPERS

import { fetchMagicAddress } from "./magic";

/**
 * Sums liquidity of a given block
 * @param block
 * @returns number
 */
export const sumValues = (block: MapOfLpCount): number => {
  const allLiquidity: number[] = Object.values(block);
  return allLiquidity.reduce((acc, current) => {
    return acc + current;
  }, 0);
};

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
