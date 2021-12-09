import { getFees } from "./trade-volume";
import { getAllUsers } from "./users";
import { fetchMagicAddress } from "./magic";
import { getAllFeesInEpoch } from "./fees";
import { sumValues } from "./lp-helpers";

const SCALE_FACTOR = Math.pow(10, 6);

export async function generateFeesSnapshot(
  startTimestamp: number,
  endTimestamp: number,
  totalSupply: number
): Promise<any> {
  console.log(
    `Generating fees snapshot from timestamp ${startTimestamp} to ${endTimestamp}: `
  );

  // get all users
  const fees: { feeAmount: number; userId: string }[] = await getAllFeesInEpoch(
    startTimestamp,
    endTimestamp
  );

  const userFeeMap = fees.reduce<{ [userId: string]: number }>((acc, tx) => {
    const userId = tx.userId.toLowerCase();
    if (!acc[userId]) {
      acc[userId] = 0;
    }
    const feeAmountNum =
      typeof tx.feeAmount === "number" ? tx.feeAmount : parseInt(tx.feeAmount);
    const scaledNum = feeAmountNum / SCALE_FACTOR;

    acc[userId] += scaledNum;
    return acc;
  }, {});

  const feeSum = sumValues(userFeeMap);
  console.log('feeSum', feeSum)

  const feePointsMap = Object.keys(userFeeMap).reduce((acc, liquidityProvider) => {
    if (!acc[liquidityProvider]) {
      acc[liquidityProvider] = 0;
    }
	const percentOfTotalFees = userFeeMap[liquidityProvider] / feeSum;
    acc[liquidityProvider] = percentOfTotalFees / totalSupply
    return acc;
  }, {});

  return feePointsMap;
}
