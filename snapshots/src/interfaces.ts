import {RewardToken} from './lp-helpers';

export type MapOfCount = { [address: string]: number };

export interface UserAmount {
    user: string;
    amount: number;
}

export enum ReturnType {
    Map = "map",
    Snapshot = "snapshot",
}

export interface LpSnapshot {
    eoaWallet: string | null;
    amount: number;
}

export interface ReturnSnapshot extends LpSnapshot {
    proxyWallet: string;
}

export interface UserRewardForStrapi {
    username: string
    amount: string
    index: number
    proof: string[]
    epoch: number
    reward_token: number
}
