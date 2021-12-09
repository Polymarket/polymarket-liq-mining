// import { fetchMagicAddress } from "./magic";
import { getAllFeesInEpoch } from "./fees";
import {
  sumValues,
  makePointsMap,
  makePayoutsMap,
  cleanUserAmounts,
} from "./helpers";

export async function generateFeesSnapshot(
  startTimestamp: number,
  endTimestamp: number,
  totalSupply: number
): Promise<any> {
  console.log(
    `Generating fees snapshot from timestamp ${startTimestamp} to ${endTimestamp}: `
  );

  // get all users
  const fees = await getAllFeesInEpoch(startTimestamp, endTimestamp);
  console.log("fees", fees);
  const cleanedUserAmounts = cleanUserAmounts(fees);

  const pointsMap = makePointsMap(cleanedUserAmounts);
//   console.log("pointsMap", pointsMap);
  const feeSum = sumValues(pointsMap);
//   console.log("feeSum", feeSum);
  const payoutMap = makePayoutsMap(pointsMap, feeSum, totalSupply);
//   console.log("payoutMap", payoutMap);

  return payoutMap;
}
