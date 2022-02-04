export interface Transaction {
    to: string;
    data: string;
    value: string;
}
export interface IsClaimed {
    address: string;
    index: number;
    isClaimed: boolean;
    proof: string[];
    amount: string;
}
export declare enum Token {
    Uma = "uma",
    Matic = "matic"
}
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
//# sourceMappingURL=types.d.ts.map