import { getAllUsersQuery } from "./queries"
import { queryGqlClient } from "./client";


/**
 * Pull all polymarket users from the subgraph 
 * @param timestamp - get all users before this timestamp
 */
 export const getAllUsers = async (timestamp: number) : Promise<string[]> => {
    let lastId = "";
    const users: string[] = [];
    console.log(`Pulling all users from subgraph...`);
    const search = true;
    
    //timestamps as seconds in the subgraph(JS stores in milliseconds by default)
    //must normalize the timestamp here
    const timestampInSeconds = timestamp / 1000;

    while(search) {
        //Subgraph can only pull 1k accounts at a time, 
        //queries the subgraph until all users are pulled
        const { data } = await queryGqlClient(getAllUsersQuery, 
            {lastId: lastId, timestamp: `${timestampInSeconds}`}
        );

        if(data.accounts.length == 0){
            break;
        }

        for(const account of data.accounts){
            //each account that is added must have added liquidity or traded in the past 
            if(account.transactions.length > 0 || account.fpmmPoolMemberships.length > 0){
                users.push(account.id);
            }
        }
        lastId = data.accounts[data.accounts.length -1].id;
   }
   console.log(`Found ${users.length} users!`);
   return users;
}