import {Interface} from "@ethersproject/abi";
import {BigNumberish} from "@ethersproject/bignumber";
import ERC20ABI from "./abi/ERC20.json";
import {CallType, Transaction} from "./types";

const encodeTokenTransfer = (
    recipientAddress: string,
    amount: BigNumberish
): string =>
    new Interface(ERC20ABI).encodeFunctionData("transfer(address,uint256)", [
        recipientAddress,
        amount,
    ]);

/**
 * @param tokenAddress - address of the ERC20 token to be transferred
 * @param recipient - where token will be transferred to
 * @param amount - amount of tokens to be transferred
 */
export const erc20TransferTransaction = (
    tokenAddress: string,
    recipient: string,
    amount: BigNumberish
): Transaction => ({
    to: tokenAddress,
    typeCode: CallType.Call,
    data: encodeTokenTransfer(recipient, amount),
    value: "0x0",
});
