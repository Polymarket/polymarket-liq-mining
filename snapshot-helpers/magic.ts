import { queryGqlClient } from "./client";
import { provider } from "./provider";
import IRelayerHub from "./abis/IRelayHub";
import { allTransactionsPerUserQuery } from "./queries"
import { TransactionReceipt } from "@ethersproject/providers";
import { ethers } from "ethers";
import fs from "fs";


const RELAY_HUB_ADDRESS = "0xD216153c06E857cD7f72665E0aF1d7D82172F494";
const RElAY_HUB_INTERFACE = new ethers.utils.Interface(IRelayerHub);

const TXN_RELAY_EVENT_TOPIC_HASH = 
    ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
            "TransactionRelayed(address,address,address,bytes4,uint8,uint256)")
    );

async function isEOA(address: string): Promise<boolean> {
    const codeAtAddress = await provider.getCode(address);
    return codeAtAddress == "0x";
}


async function getTransactionReceipt(transactionHash: string) : Promise<TransactionReceipt> {
    const transactionReceipt = await provider.getTransactionReceipt(transactionHash);
    if(transactionReceipt != null &&
        transactionReceipt.to != null && 
        transactionReceipt.to == RELAY_HUB_ADDRESS){
        return transactionReceipt;
    }
    return null;
}

async function getTransactions(address: string): Promise<string[]> {
    const transactionHashes = [];

    const { data } = await queryGqlClient(allTransactionsPerUserQuery, 
        {user: address});
    
    data.transactions.forEach(el => transactionHashes.push(el.id));
    data.fpmmFundingAdditions.forEach(el => transactionHashes.push(el.id));
    return transactionHashes;
}

const magicAddressCacheName = "proxy-wallet-to-magic-addresses.json";
const magicAddressCache = JSON.parse(fs.readFileSync(magicAddressCacheName).toString());

/**
 * Gets the corresponding magic link address for a proxy wallet address
 * Fetches the address from a pre-populated cache.
 * Falls back to the subgraph and RPC provider if the address is not found
 * @param address 
 * @returns 
 */
 export const fetchMagicAddress = async (address: string) : Promise<string> => {
    let magicAddress = magicAddressCache[address];
    if(magicAddress == null){
        magicAddress = await getMagicLinkAddress(address);
    }
    return magicAddress;
}

/**
 * Gets the corresponding magic link address for a proxy wallet
 * Queries the subgraph and a Matic RPC provider for TransactionRelayed event logs, which index the magic address
 * @param address: string 
 * @returns magicAddress: string
 */
export const getMagicLinkAddress = async (address: string) : Promise<string> => {
    if(await isEOA(address)){
        return address;
    }

    const transactionHashes: string[] = await getTransactions(address);
    for(const transactionHash of transactionHashes){
        const transactionReceipt: TransactionReceipt = await getTransactionReceipt(transactionHash);
        if(transactionReceipt != null){
            for(const log of transactionReceipt.logs) {
                
                //First topic is always a hash of the name of the event
                const topicHash = log.topics[0];
                if(topicHash == TXN_RELAY_EVENT_TOPIC_HASH) {
                    const txnRelayedEvent = RElAY_HUB_INTERFACE.parseLog(log);                    
                    const magicAddress = txnRelayedEvent.args.from;
                    return magicAddress;
                }
            }
        }
    }
    return null;
}