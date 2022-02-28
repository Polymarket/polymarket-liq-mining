export declare enum CallType {
    Invalid = "0",
    Call = "1",
    DelegateCall = "2"
}
export interface Transaction {
    to: string;
    typeCode?: CallType;
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