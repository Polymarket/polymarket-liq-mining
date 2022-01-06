export interface MerkleDistributorInfo {
    merkleRoot: string;
    tokenTotal: string;
    claims: {
        [account: string]: {
            index: number;
            amount: string;
            proof: string[];
            flags?: {
                [flag: string]: boolean;
            };
        };
    };
}
export declare type OldFormat = {
    [account: string]: number | string;
};
export declare type NewFormat = {
    address: string;
    earnings: string;
    reasons: string;
};
export declare function parseBalanceMap(balances: OldFormat | NewFormat[]): MerkleDistributorInfo;
//# sourceMappingURL=parse-balance-map.d.ts.map