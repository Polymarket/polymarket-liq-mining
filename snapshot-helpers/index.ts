import client from "./client";
import { gql } from "@apollo/client";

export interface User {
    address: string, 
    weight?: number
}

const getAllUsersQuery = gql`
    query allAccounts($lastId: String!){
        accounts(
            where: {id_gt: $lastId}
            first: 1000
        ){
            id
        }
    }
`;

/**
 * Pull all polymarket users from the graph 
 */
export const getAllUsers = async () : Promise<User[]> => {
    var lastId = "";
    var users: User[] = [];

    while(true) {
        //Subgraph can only pull 1k accounts at a time, 
        //queries the subgraph until all users are pulled
        const { data } = await client.query({
            query: getAllUsersQuery,
            variables: {
                lastId: lastId
            }
        });

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


// export const calculateTokenWeight = async (address: string): number {

// }

/*
// NOTE: not sure what time timestamp will be here because it's a BigInt
function getTransactionPoints(address: string, timestamp: any)

    //TODO: something something
    returns 1 if the user has made a transaction before timestamp, otherwise 0.
*/

/*
function getLiquidityProviderPoints(address: string, timestamp)
    returns 3 if the user has provided liquidity before timestamp, otherwise 0.
*/

/*
function getMagicLinkAddress(userAddress: string)
    - if the address is an EOA, return the address
        - you can use provider.getCode(address) to check if there is code at the address (https://docs.ethers.io/v5/api/providers/provider/#Provider--transaction-methods)
            - if there is code at the address, it is a contract account, not an externally owned account (EOA)
    - find a transaction from userAddress in the graph that was sent through Gas Station Network
        - test all Transaction and FpmmFundingAddition until you find a tx sent to 0xD216153c06E857cD7f72665E0aF1d7D82172F494 (the relay hub)
            - you'll need to use provider.getTransaction() to get the full tx data (https://docs.ethers.io/v5/api/providers/provider/#Provider--transaction-methods)
    - use parseLog (https://docs.ethers.io/v5/api/utils/abi/interface/#Interface--parsing) to find the TransactionRelayed event on the transaction
        - signature can be found at https://github.com/Polymarket/poly-gsn/blob/main/packages/contracts/contracts/gsn/IRelayHub.sol#L154
        - if this event does not exist on the transaction, try the next tranasaction
        - if the event does exist, find and return the EOA that signed the transaction
*/