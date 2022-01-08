import * as dotenv from "dotenv";
import * as yargs from "yargs";
import fetch from "cross-fetch";
import { generateLpSnapshot } from "../src/lp-snapshot";
import * as fs from "fs";
import {
  normalizeEarningsNewFormat,
  combineMaps,
  formatClaimsForStrapi,
  combineMerkleInfo,
} from "../src/helpers";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
  NewFormat,
} from "../../merkle-distributor/src/parse-balance-map";
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { ReturnType, MapOfCount } from "../src/interfaces";
import {
  RewardEpochFromStrapi,
  ensureGoodDataFromStrapi,
  cleanEpochInfoFromStrapi,
} from "../src/lp-helpers";
import { BigNumber, ethers, providers } from "ethers";
import { getAmountInEther } from "../src/helpers";
import { DistributorSdk } from "../../sdk/src/distributorSdk";
import { JsonRpcSigner } from "@ethersproject/providers";

const DEFAULT_FILE_PATH = `./snapshots/week`;

const DEFAULT_BLOCKS_PER_SAMPLE = 1800; // Approx every hour with a 2s block time
// const DEFAULT_BLOCKS_PER_SAMPLE = 30; // Approx every min with a 2s block time
// const DEFAULT_TOKENS_PER_SAMPLE = 60; // tokens_per_block * block_per_sample

dotenv.config();

const args = yargs.options({
  baseFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_FILE_PATH,
  },
  blocksPerSample: {
    type: "number",
    demandOption: false,
    default: DEFAULT_BLOCKS_PER_SAMPLE,
  },
  strapiUrl: {
    type: "string",
    demandOption: false,
    default: `http://localhost:1337`,
  },
  epoch: {
    type: "number",
    demandOption: false,
    default: 1, // MANUALLY INCREMENT EPOCH HERE!
  },
  distributorAddress: {
    type: "string",
    demandOption: false,
    default: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
  rpcUrl: {
    type: "string",
    demandOption: false,
    default: "http://127.0.0.1:8545/",
  },
}).argv;

(async (args: any) => {
  const epochRes = await fetch(
    `${args.strapiUrl}/reward-epoches/${args.epoch}`
  );
  const epochInfo: RewardEpochFromStrapi = await epochRes.json();
  ensureGoodDataFromStrapi(epochInfo);
  if (epochInfo.epoch !== parseInt(args.epoch)) {
    throw new Error("Epochs do not match!");
  }
  const { startTimestamp, endTimestamp, markets, feeTokenSupply } =
    cleanEpochInfoFromStrapi(epochInfo);

  console.log("start Date", new Date(startTimestamp));
  console.log("end Date", new Date(endTimestamp));

  const t1 = Date.now();
  const liqMap = await generateLpSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    markets,
    args.blocksPerSample
  );
  console.log("liqMap", Object.keys(liqMap).length + " liquidity providers");
  const t2 = Date.now();
  const feeMap = await generateFeesSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    feeTokenSupply
  );
  console.log("feeMap", Object.keys(feeMap).length + " users who paid fees");
  const t3 = Date.now();
  const currentEpochUserMap = combineMaps([
    liqMap as MapOfCount,
    feeMap as MapOfCount,
  ]);
  console.log(
    "currentEpochUserMap",
    Object.keys(currentEpochUserMap).length + " total users"
  );

  const createMerkleRootFileName = (epoch: number) => {
    return `${args.baseFilePath}-${epoch}-merkle-info.json`;
  };
  console.log("epochInfo.epoch", epochInfo.epoch);

  let merkleInfo: MerkleDistributorInfo;

  if (epochInfo.epoch === 0) {
    const normalizedEarnings = normalizeEarningsNewFormat(currentEpochUserMap);
    merkleInfo = parseBalanceMap(normalizedEarnings);
  }

  if (epochInfo.epoch > 0) {
    // from hardhat config =>
    const mnemonic =
      "test test test test test test test test test test test junk";
    const provider = new providers.JsonRpcProvider(args.rpcUrl);
    // const deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    const account = ethers.utils.HDNode.fromMnemonic(mnemonic);

    // console.log("account", account);
    const walletWithProvider = new ethers.Wallet(account, provider);
    walletWithProvider.connect(provider);
    // console.log("walletWithProvider", walletWithProvider);
    const signer = provider.getSigner();
    // console.log("signer", signer);

    const sdk = new DistributorSdk(
      // @ts-ignore
      signer,
      31337,
      "token-address-not-needed-to-freeze",
      args.distributorAddress
    );

    try {
      const prevFile = fs
        .readFileSync(createMerkleRootFileName(args.epoch - 1))
        .toString();

      const prevMerkleInfo: MerkleDistributorInfo = JSON.parse(prevFile);
      const previousClaims = await sdk.getClaimedStatus(prevMerkleInfo);

      merkleInfo = combineMerkleInfo(previousClaims, currentEpochUserMap);
      await sdk.freeze();
      await sdk.updateMerkleRoot(merkleInfo.merkleRoot);
      await sdk.unfreeze();
    } catch (error) {
      console.log("error", error);
    }
  }

  console.log(
    "merkleInfo",
    Object.keys(merkleInfo.claims).length + " total claims"
  );
  console.log("liq diff", t2 - t1);
  console.log("fee diff", t3 - t2);
  try {
    fs.writeFileSync(
      createMerkleRootFileName(args.epoch),
      JSON.stringify(merkleInfo)
    );
  } catch (error) {
    console.log("write merkle snapshot", error);
  }
  const usersForStrapi = formatClaimsForStrapi(merkleInfo, args.epoch);
  try {
    await fetch(`${args.strapiUrl}/reward-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usersForStrapi),
    });
  } catch (error) {
    console.log("error", error);
  }
})(args);
