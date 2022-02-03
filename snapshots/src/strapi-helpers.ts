import {RewardEpochFromStrapi, RewardTokenFromStrapi} from "./lp-helpers";
import fetch from "cross-fetch";
import {UserRewardForStrapi} from "./interfaces";

export async function fetchRewardUsersCount(STRAPI_URL: string): Promise<number> {
    const response = await fetch(`${STRAPI_URL}/reward-users/count`);
    return await response.json();
}

export async function fetchRewardUsersForEpoch(STRAPI_URL: string, epoch: number): Promise<UserRewardForStrapi[]> {
    const response = await fetch(`${STRAPI_URL}/reward-users?epoch=${epoch}`);
    return await response.json();
}

export async function fetchRewardMarketsCount(STRAPI_URL: string): Promise<number> {
    const response = await fetch(`${STRAPI_URL}/reward-markets/count`);
    return await response.json();

}

export async function fetchRewardEpochsCount(STRAPI_URL: string): Promise<number> {
    const response = await fetch(`${STRAPI_URL}/reward-epoches/count`);
    return await response.json();
}

export async function fetchRewardEpochs(STRAPI_URL: string): Promise<RewardEpochFromStrapi[]> {
    const response = await fetch(`${STRAPI_URL}/reward-epoches`);
    return await response.json();
}

export async function fetchRewardTokens(STRAPI_URL: string): Promise<RewardTokenFromStrapi[]> {
    const response = await fetch(`${STRAPI_URL}/reward-tokens`);
    return await response.json();
}
