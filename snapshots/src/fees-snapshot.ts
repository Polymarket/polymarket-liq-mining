import { getAllFeesInEpoch } from "./fees";
import { MapOfCount, ReturnSnapshot, ReturnType } from "./interfaces";
import {
  sumValues,
  makePointsMap,
  makePayoutsMap,
  cleanUserAmounts,
  addEoaToUserPayoutMap,
} from "./helpers";

export async function generateFeesSnapshot(
  returnType: ReturnType,
  startTimestamp: number,
  endTimestamp: number,
  tokensPerEpoch: number
): Promise<ReturnSnapshot[] | MapOfCount> {
  console.log(
    `Generating fees snapshot from timestamp ${new Date(startTimestamp).toString()} to ${new Date(endTimestamp).toString()}: `
  );

  console.log(
    `Total Token Supply for Fees: ${tokensPerEpoch} tokens`
  );

  const fees = await getAllFeesInEpoch(startTimestamp, endTimestamp);
  const cleanedUserAmounts = cleanUserAmounts(fees);
  const pointsMap = makePointsMap(cleanedUserAmounts);
  const feeSum = sumValues(pointsMap);
  const payoutMap = makePayoutsMap(pointsMap, feeSum, tokensPerEpoch);
  if (returnType === ReturnType.Map) {
    return payoutMap;
  }
  return addEoaToUserPayoutMap(payoutMap);
}
