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
  magicWallet: string | null;
  amount: number;
}

export interface ReturnSnapshot extends LpSnapshot {
  proxyWallet: string;
}
