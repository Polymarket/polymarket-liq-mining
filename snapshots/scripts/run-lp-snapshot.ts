import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateLpSnapshot } from "../src/lp-snapshot";
import { writeSnapshot } from "../src/utils";
import { lowerCaseMarketMakers, LpCalculation } from "../src/lp-helpers";
import { EIGHT_DAYS_AGO, TWO_DAYS_AGO } from "../src/helpers";

const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/lp-weighted-";

const DEFAULT_LP_TOKENS_PER_BLOCK = 2;
const DEFAULT_LP_TOKENS_PER_MARKET = 1000000;

// const DEFAULT_BLOCKS_PER_SAMPLE = 1800; //Approx every hour with a 2s block time
const DEFAULT_BLOCKS_PER_SAMPLE = 30; // Approx every min with a 2s block time
// const DEFAULT_BLOCKS_PER_SAMPLE = 1; // Every block

dotenv.config();

const args = yargs.options({
    startTimestamp: {
        type: "number",
        demandOption: false,
        default: EIGHT_DAYS_AGO,
    },
    endTimestamp: {
        type: "number",
        demandOption: false,
        default: TWO_DAYS_AGO,
    },
    snapshotFilePath: {
        type: "string",
        demandOption: false,
        default: DEFAULT_SNAPSHOT_FILE_PATH,
    },
    incentivizedMarkets: {
        type: "array",
        demandOption: false,
        default: [
            {
                marketMaker: "0xeAcfAAbE72C9a300df227B3d7cc63b8cC448138E",
                slug: "who-will-win-2021-chilean-presidential-elections",
                howToCalculate: LpCalculation.PerMarket,
                amount: 4000,
            },
            {
                marketMaker: "0xB7FA5978C926701e122548aeA39724C1dAF6F0eA",
                slug: "who-will-win-jake-paul-v-tyron-woodley",
                howToCalculate: LpCalculation.PerMarket,
                amount: 10000,
            },
            {
                marketMaker: "0x25F8b3910D21424035729e04d595Db21afD3361B",
                slug: "will-gavin-newsom-be-governor-of-california-on-december-31-2021",
                howToCalculate: LpCalculation.PerBlock,
                amount: 2,
            },
            {
                marketMaker: "0x87C05AaA91843eec2f2d3C8B227B3dCc9DF04184",
                slug: "will-spacexs-starship-successfully-reach-outer-space-by-december-31-2021",
                howToCalculate: LpCalculation.PerBlock,
                amount: 3,
            },
            {
                marketMaker: "0x1E388fD85eBa65182Ad9AE52A0eab094aF785eE1",
                slug: "will-hikaru-nakamura-win-the-2021-speed-chess-championship-main-event",
                howToCalculate: LpCalculation.PerMarket,
                amount: 8000,
            },
        ],
    },
    lpTokensPerMarket: {
        type: "string",
        demandOption: false,
        default: DEFAULT_LP_TOKENS_PER_MARKET,
    },
    lpTokensPerBlock: {
        type: "number",
        demandOption: false,
        default: DEFAULT_LP_TOKENS_PER_BLOCK,
    },
    blocksPerSample: {
        type: "number",
        demandOption: false,
        default: DEFAULT_BLOCKS_PER_SAMPLE,
    },
}).argv;

(async (args: any) => {
    const snapshot = await generateLpSnapshot(
        args.startTimestamp,
        args.endTimestamp,
        lowerCaseMarketMakers(args.incentivizedMarkets),
        args.blocksPerSample,
        true,
    );
    console.log("snapshot outside", snapshot);

    const snapshotFileName = `${
        args.snapshotFilePath + args.endTimestamp.toString()
    }.json`;
    await writeSnapshot(snapshotFileName, args.snapshotFilePath, snapshot);
})(args);
