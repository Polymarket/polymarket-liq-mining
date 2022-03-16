import { BigNumber } from "@ethersproject/bignumber";
export type MapOfCount = { [address: string]: number };

export interface UserAmount {
    user: string;
    amount: number;
}

export interface LpSnapshot {
    eoaWallet: string | null;
    amount: number;
}

export interface ReturnSnapshot extends LpSnapshot {
    proxyWallet: string;
}

export interface UserRewardForStrapi {
    username: string;
    amount: string;
    index: number;
    proof: string[];
    epoch: number;
    reward_token: number;
    estimated_liq: string;
}

export type UserEstimatedRewardForStrapi = Omit<
    UserRewardForStrapi,
    "proof" | "index" | "amount"
>;

export type UserActualRewardForStrapi = Omit<
    UserRewardForStrapi,
    "estimated_liq"
>;
