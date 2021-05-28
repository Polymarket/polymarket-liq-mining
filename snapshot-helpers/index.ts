import { queryGqlClient } from "./client";
import { provider } from "./provider";
import IRelayerHub from "./abis/IRelayHub";
import { getAllUsersQuery, userActivityQuery, allTransactionsPerUserQuery } from "./queries"
import { TransactionReceipt } from "@ethersproject/providers";
import { ethers } from "ethers";

export interface User {
    address: string, 
    points?: number
}

const RELAY_HUB_ADDRESS = "0xD216153c06E857cD7f72665E0aF1d7D82172F494";
const RElAY_HUB_INTERFACE = new ethers.utils.Interface(IRelayerHub);

const TXN_RELAY_EVENT_TOPIC_HASH = 
    ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
            "TransactionRelayed(address,address,address,bytes4,uint8,uint256)")
    );


/**
 * Pull all polymarket users from the graph 
 * @param timestamp - get all users before this timestamp
 */
export const getAllUsers = async (timestamp: number) : Promise<User[]> => {
    let lastId = "";
    const users: User[] = [];
    console.log(`Pulling all users from subgraph...`);
    const search = true;

    while(search) {
        //Subgraph can only pull 1k accounts at a time, 
        //queries the subgraph until all users are pulled
        const { data } = await queryGqlClient(getAllUsersQuery, 
            {lastId: lastId, timestamp: `${timestamp}`}
        );

        if(data.accounts.length == 0){
            break;
        }
        data.accounts.forEach(element => 
            users.push({address: element.id})    
        );
        lastId = data.accounts[data.accounts.length -1].id;
   }
   return users;
}


export const calculatePointsPerUser = async (address: string, timestamp: number): Promise<number> => {
    const userActivity = await getUserActivity(address, timestamp);
    const pointsForTransacting = getPointsForTransacting(userActivity);
    const pointsForProvidingLiquidity = getPointsForProvidingLiquidity(userActivity);
    return pointsForTransacting + pointsForProvidingLiquidity;
}


async function getUserActivity(address: string, timestamp: number) : Promise<any> {
    const response = await queryGqlClient(userActivityQuery,  
        {user:address, timestamp: `${timestamp}`});
    return response.data;
}

function getPointsForTransacting(activityData:any): number {
    const transactingData = activityData.transactions;
    let points = 0;
    if(transactingData.length > 0){
        points= 1;
    }
    return points;
}


function getPointsForProvidingLiquidity(activityData): number {
    const addLiquidityData = activityData.fpmmFundingAdditions;
    let points = 0;
    if(addLiquidityData.length > 0){
        points = 3;
    }
    return points;
}
    

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
    console.log(`Finding eligible transactions for ${address}...`);

    const transactionHashes = [];

    const { data } = await queryGqlClient(allTransactionsPerUserQuery, 
        {user: address});
    
    data.transactions.forEach(el => transactionHashes.push(el.id));
    data.fpmmFundingAdditions.forEach(el => transactionHashes.push(el.id));
    return transactionHashes;
}


export const getMagicLinkAddress = async (address: string) : Promise<string> => {
    if(await isEOA(address)){
        return address;
    }
    const transactionHashes = await getTransactions(address);

    for(const transactionHash of transactionHashes){
        const transactionReceipt: TransactionReceipt = await getTransactionReceipt(transactionHash);
        if(transactionReceipt != null){
            for(const log of transactionReceipt.logs) {
                //First topic is always a hash of the name of the event
                const topicHash = log.topics[0];
                if(topicHash == TXN_RELAY_EVENT_TOPIC_HASH) {
                    const txnRelayedEvent = RElAY_HUB_INTERFACE.parseLog(log);
                    //"from" on the event should be the magic wallet address
                    const magicAddress = txnRelayedEvent.args.from;
                    return magicAddress;
                }
            }
        }
    }
    return null;
}

