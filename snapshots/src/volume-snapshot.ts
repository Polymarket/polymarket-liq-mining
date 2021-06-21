import { getTradeVolume } from "./trade-volume";
import { getAllUsers } from "./users";
import { fetchMagicAddress } from "./magic";

const snapshot: { proxyWallet: string, magicWallet: string; amount: number }[] = [];

export async function generateVolumeSnapshot(timestamp: number, supply: number): Promise<any> {
    console.log(`Generating volume weighted snapshot with timestamp: ${timestamp} and token total supply: ${supply}...`);
    
    // get all users
    const users: string[] = await getAllUsers(timestamp); 
    
    //get volume per user at the timestamp
    console.log(`Fetching trade volume per user at snapshot...`);
    const tradeVolumes = await getTradeVolume(users, timestamp);
    
    // get total volume
    const totalTradeVolume = tradeVolumes.reduce(function(prev, current){
        return prev + current;
    }, 0);
    console.log(`Complete! Total trade volume: ${totalTradeVolume}!`);

    for(const userIndex in users){
        const user = users[userIndex];
        const userVolume = tradeVolumes[userIndex];
        if(userVolume > 0){
            const airdropAmount = (userVolume / totalTradeVolume) * supply;
            const magicAddress = await fetchMagicAddress(user);
            snapshot.push({proxyWallet: user, magicWallet: magicAddress, amount: airdropAmount });
        }
    }
    return snapshot;
}