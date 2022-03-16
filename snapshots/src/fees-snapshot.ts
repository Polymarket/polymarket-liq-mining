import { getAllFeesInEpoch } from "./fees";
import { MapOfCount } from "./interfaces";
import {
    sumValues,
    makePointsMap,
    makePayoutsMap,
    cleanUserAmounts,
} from "./helpers";
import { EXCLUDED_ACCOUNT_MAP } from "./ban_list";

export async function generateFeesSnapshot(
    startTimestamp: number,
    endTimestamp: number,
    tokensPerEpoch: number,
): Promise<MapOfCount> {
    console.log(
        `Generating fees snapshot from timestamp ${new Date(
            startTimestamp,
        ).toString()} to ${new Date(endTimestamp).toString()}: `,
    );

    console.log(`Total Token Supply for Fees: ${tokensPerEpoch} tokens`);

    const fees = await getAllFeesInEpoch(startTimestamp, endTimestamp);
    const cleanedUserAmounts = cleanUserAmounts(fees, EXCLUDED_ACCOUNT_MAP);
    const pointsMap = makePointsMap(cleanedUserAmounts);
    const feeSum = sumValues(pointsMap);
    const payoutMap = makePayoutsMap(pointsMap, feeSum, tokensPerEpoch);
    return payoutMap;
}
