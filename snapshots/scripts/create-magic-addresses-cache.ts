import fs from "fs";
import yargs from "yargs";
import { getAllUsers, getMagicLinkAddress } from "../src";


const DEFAULT_CACHE_NAME = "./proxy-wallet-to-magic-addresses.json";

//Args
const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'fileName': { type: 'string', demandOption: false, default: DEFAULT_CACHE_NAME },
  }).argv;

const proxyAddressToMagicAddressMapping = {};

/**
 * Helper script to generate a cache of proxy wallet address to magic addresses
 * Takes in a timestamp, pulls all polymarket users at the timestamp and then generates 
 * a json file
 */

async function main(args:any){
    const timestamp = args.timestamp;
    const fileName = args.fileName;
    const users: string[] = await getAllUsers(timestamp);
    
    for(const user of users){
        const magicAddress = await getMagicLinkAddress(user);
        proxyAddressToMagicAddressMapping[user] = magicAddress;
    }
    console.log(`Writing mapping to disk...`);
    fs.writeFileSync(fileName, JSON.stringify(proxyAddressToMagicAddressMapping));
    console.log(`Complete!`);
}

main(args);