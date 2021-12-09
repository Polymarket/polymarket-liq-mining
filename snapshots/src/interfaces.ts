export type MapOfCount = { [address: string]: number };

export interface UserAmount {
  user: string;
  amount: number;
}

export enum ReturnType {
  Map = "map",
  Eoa = "eoa",
}

export interface LpSnapshot {
  magicWallet: string | null;
  amount: number;
}

export interface ReturnSnapshot extends LpSnapshot {
  proxyWallet: string;
}
