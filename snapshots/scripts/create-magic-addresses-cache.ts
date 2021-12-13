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
  const oldCache = magicAddressCache;
  const cachedAddresses = Object.keys(oldCache);
  console.log("Cached addresses length:", `${cachedAddresses.length} users`);
  const newCache = { ...oldCache };
  const users: string[] = await getAllUsers(timestamp);

  let count = 1;
  for (const user of users) {
    console.log("User - ", user);
    if (!newCache[user]) {
      console.log("cache[user] - ", newCache[user]);
      try {
        const magicAddress = await getMagicLinkAddress(user);
        if (magicAddress) {
          console.log("magicAddress exists -", magicAddress);
          newCache[user] = magicAddress;
          count++;
          console.log(
            "Saved! number of magic addresses saved this session:",
            count
          );
          if (count % 100 === 0) {
            console.log("Saving magic cache!");
            writeToMagicCache(newCache);
          }
        } else {
          console.log("magicAddress does not exist", magicAddress);
        }
      } catch (error) {
        console.error(error);
        console.log(
          `Error! Found ${
            Object.keys(newCache).length - cachedAddresses.length
          } new addresses`
        );
        writeToMagicCache(newCache);
        break;
      }
    } else {
      console.log("Cache hit! - ", newCache[user]);
    }
  }

  console.log(`Writing mapping to disk...`);
  writeToMagicCache(newCache);
  console.log(`Complete!`);
})(args);
