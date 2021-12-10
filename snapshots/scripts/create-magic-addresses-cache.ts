// import fs from "fs";
import yargs from "yargs";
import {
  getMagicLinkAddress,
  //   magicAddressCacheName,
  magicAddressCache,
  writeToMagicCache,
} from "../src/magic";
import { getAllUsers } from "../src/users";
import * as dotenv from "dotenv";

// const DEFAULT_CACHE_NAME = "../snapshots/proxy-wallet-to-magic-addresses.json";

dotenv.config();

//Args
const args = yargs.options({
  timestamp: { type: "number", demandOption: false, default: Date.now() },
}).argv;

/**
 * Helper script to generate a cache of proxy wallet address to magic addresses
 * Takes in a timestamp, pulls all polymarket users at the timestamp and then generates
 * a json file
 */

(async (args: any) => {
  const timestamp = args.timestamp;
  console.log(`Pulling all users`);
  const oldCache = magicAddressCache;
  const oldLength = Object.keys(oldCache).length;
  console.log("Pulling old cache, length:", `${oldLength} users`);
  const newCache = { ...oldCache };
  const users: string[] = await getAllUsers(timestamp);

  console.log(`Pulling all addresses`);
  for (const user of users) {
    if (!newCache[user] || newCache[user] === null) {
      try {
        const magicAddress = await getMagicLinkAddress(user);
        newCache[user] = magicAddress;
      } catch (error) {
        console.log(
          `Error! Found ${Object.keys(newCache).length - oldLength} new addresses`
        );
        writeToMagicCache(newCache);
		break;
      }
    }
  }

  console.log(`Writing mapping to disk...`);
  writeToMagicCache(newCache);
  console.log(`Complete!`);
})(args);
