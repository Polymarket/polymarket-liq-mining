import { BigNumberish } from "@ethersproject/bignumber";
import { Transaction } from "./types";
/**
 * @param tokenAddress - address of the ERC20 token to be transferred
 * @param recipient - where token will be transferred to
 * @param amount - amount of tokens to be transferred
 */
export declare const erc20TransferTransaction: (tokenAddress: string, recipient: string, amount: BigNumberish) => Transaction;
//# sourceMappingURL=erc20.d.ts.map