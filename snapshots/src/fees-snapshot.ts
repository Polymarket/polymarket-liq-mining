// import { fetchMagicAddress } from "./magic";
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
  totalSupply: number
): Promise<ReturnSnapshot[] | MapOfCount> {
  console.log(
    `Generating fees snapshot from timestamp ${startTimestamp} to ${endTimestamp}: `
  );
  const fees = await getAllFeesInEpoch(startTimestamp, endTimestamp);
  const cleanedUserAmounts = cleanUserAmounts(fees);
  const pointsMap = makePointsMap(cleanedUserAmounts);
  const feeSum = sumValues(pointsMap);
  const payoutMap = makePayoutsMap(pointsMap, feeSum, totalSupply);
  if (returnType === ReturnType.Map) {
    return payoutMap;
  }
  return addEoaToUserPayoutMap(payoutMap);
}
