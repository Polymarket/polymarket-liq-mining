import { Token } from './types';
declare type RegistryContracts = {
    distributor: string;
    [Token.Uma]: string;
    [Token.Matic]: string;
};
export declare const MAINNET_CONTRACTS: RegistryContracts;
export declare const MUMBAI_CONTRACTS: RegistryContracts;
export declare const getContracts: (network: number) => RegistryContracts;
export {};
//# sourceMappingURL=networks.d.ts.map