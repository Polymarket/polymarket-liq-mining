// import fs from "fs";
import yargs from "yargs";
import { eoaCache, getEoaLinkAddress, writeToEoaCache } from "../src/eoa";
import { getAllUsers } from "../src/users";
import * as dotenv from "dotenv";

dotenv.config();

//Args
const args = yargs.options({
  timestamp: { type: "number", demandOption: false, default: Date.now() },
}).argv;

/**
 * Helper script to generate a cache of proxy wallet address to eoa wallets
 * Takes in a timestamp, pulls all polymarket users at the timestamp and then generates
 * a json file
 */

(async (args: any) => {
  const timestamp = args.timestamp;
  const oldCache = eoaCache;
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
        const eoaAddress = await getEoaLinkAddress(user);
        if (eoaAddress) {
          console.log("eoa exists -", eoaAddress);
          newCache[user] = eoaAddress;
          count++;
          console.log("Number of eoa addresses added this session:", count);
          if (count % 100 === 0) {
            writeToEoaCache(newCache);
            console.log("SAVED eoa cache!");
          }
        } else {
          console.log("eoa does not exist", eoaAddress);
        }
      } catch (error) {
        console.error(error);
        console.log(
          `Error! Found ${
            Object.keys(newCache).length - cachedAddresses.length
          } new addresses`
        );
        writeToEoaCache(newCache);
        break;
      }
    } else {
      console.log("Cache hit! - ", newCache[user]);
    }
  }

  console.log(`Writing mapping to disk...`);
  writeToEoaCache(newCache);
  console.log(`Complete!`);
})(args);
