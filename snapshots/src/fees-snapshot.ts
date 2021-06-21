import { getFees } from "./trade-volume";
import { getAllUsers } from "./users";
import { fetchMagicAddress } from "./magic";

const snapshot: { proxyWallet: string, magicWallet: string; feesPaid: number }[] = [];


export async function generateFeesSnapshot(startTimestamp: number, endTimestamp: number): Promise<any> {
    console.log(`Generating fees snapshot from timestamp ${startTimestamp} to ${endTimestamp}: `);
    
    // get all users
    const users: string[] = await getAllUsers(endTimestamp); 
    
    //get fees paid per user at the timestamp
    console.log(`Fetching fees paid per user at snapshot...`);
    const feesPaid = await getFees(users, startTimestamp, endTimestamp);

    for(const userIndex in users){
        const user = users[userIndex];
        const userFeesPaid = feesPaid[userIndex];
        if(userFeesPaid > 0){
            const magicAddress = await fetchMagicAddress(user);
            snapshot.push({proxyWallet: user, magicWallet: magicAddress, feesPaid: userFeesPaid });
        }
    }
    return snapshot;
}