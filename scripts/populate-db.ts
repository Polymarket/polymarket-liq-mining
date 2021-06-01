import yargs from "yargs";
import { getAllUsers, getMagicLinkAddress, getOrCreateUsersDb } from "../snapshot-helpers";

//Args
const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'startingIndex': { type: 'number', demandOption: false, default: 0},
  }).argv;


async function main(){
    const timestamp = args.timestamp;
    let startingIndex = args.startingIndex;

    const users: string[] = await getAllUsers(timestamp);
    const db = await getOrCreateUsersDb();

    while(startingIndex < users.length){
        const user = users[startingIndex];
        const magicAddress = await getMagicLinkAddress(user);
        await db.put(user, magicAddress);
        startingIndex += 1;
    }
}

main();