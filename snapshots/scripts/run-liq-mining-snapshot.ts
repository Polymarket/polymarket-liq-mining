import * as dotenv from "dotenv";
import * as yargs from "yargs";
import fetch from "cross-fetch";
import inquirer from "inquirer";
import {generateLpSnapshot} from "../src/lp-snapshot";
import * as fs from "fs";
import {
    normalizeEarningsNewFormat,
    combineMaps,
    formatClaimsForStrapi,
    combineMerkleInfo,
    hijackAddressForTesting,
} from "../src/helpers";
import {
    parseBalanceMap,
    MerkleDistributorInfo,
} from "../../merkle-distributor/src/parse-balance-map";
import {generateFeesSnapshot} from "../src/fees-snapshot";
import {ReturnType, MapOfCount} from "../src/interfaces";
import {
    RewardEpochFromStrapi,
    ensureGoodDataFromStrapi,
    cleanAndSeparateEpochPerToken, RewardToken,
} from "../src/lp-helpers";
import {BigNumber, ethers, providers} from "ethers";
import {DistributorSdk} from "../../sdk/src/distributorSdk";
import {validateEnvVars} from "../src/validate-env-vars";
import {fetchRewardEpochs, fetchRewardUsersForEpoch} from "../src/strapi-helpers";
import {
    DEFAULT_BLOCKS_PER_SAMPLE,
    HIJACK_ADDRESS_FOR_TESTING,
    LOCAL_RPC_URL,
    LOCAL_STRAPI_URL,
    PRODUCTION_RPC_URL,
    PRODUCTION_STRAPI_URL,
} from "../src/constants";
import {getDistributorAddress} from "../src/deployments";

// const DEFAULT_BLOCKS_PER_SAMPLE = 1800; // Approx every hour with a 2s block time
// const DEFAULT_BLOCKS_PER_SAMPLE = 30; // Approx every min with a 2s block time
// const DEFAULT_TOKENS_PER_SAMPLE = 60; // tokens_per_block * block_per_sample

dotenv.config();

const args = yargs.options({
    // blocksPerSample: {
    //     type: "number",
    //     demandOption: false,
    //     default: DEFAULT_BLOCKS_PER_SAMPLE,
    // },
    // baseFilePath: {
    //     type: "string",
    //     demandOption: false,
    //     default: "./snapshots/week",
    // },
    // strapiUrl: {
    //     type: "string",
    //     demandOption: false,
    //     default: `http://localhost:1337`,
    // },
    // distributorAddress: {
    //     type: "string",
    //     demandOption: false,
    //     default: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    // },
    // rpcUrl: {
    //     type: "string",
    //     demandOption: false,
    //     default: "http://127.0.0.1:8545/",
    // },
    // ------------------------------------------------
    // ------------------------------------------------
    // epoch: {
    //     type: "number",
    //     demandOption: false,
    //     default: 0, // MANUALLY INCREMENT EPOCH HERE!
    // },
    // ------------------------------------------------
    // ------------------------------------------------
}).argv;

const confirmRiskyWithMessage = async (message: string) => {
    const {confirm} = await inquirer.prompt([
        {
            type: "confirm",
            message,
            name: "confirm",
            default: false,
        },
    ]);
    return confirm;
};

(async (args: any) => {
    // check standard env vars and error if not set
    const CHECK_ENV_VARS = [
        "SUBGRAPH_URL",
        "STRAPI_ADMIN_EMAIL",
        "STRAPI_ADMIN_PASSWORD",
        "DEFAULT_BLOCKS_PER_SAMPLE",
        "SNAPSHOT_BASE_FILE_PATH"
    ];
    const validEnvVars = await validateEnvVars(CHECK_ENV_VARS);
    if (!validEnvVars) return;
    // local or production
    const {environment} = await inquirer.prompt([{
            name: "environment",
            type: "list",
            message: "Should this snapshot affect local or production strapi?",
            choices: [
                {name: `local`, value: 'local'},
                {name: `production`, value: 'production'},
            ],
        }]
    );
    console.log("Environment:", environment);

    // check relevant env vars before continuing
    const validProdEnvVars = await validateEnvVars(["PRODUCTION_STRAPI_URL", "MATIC_RPC_URL"]);
    const validLocalEnvVars = await validateEnvVars(["LOCAL_RPC_URL"]);
    if (environment === "local" && !validLocalEnvVars) return;
    if (environment !== "local" && !validProdEnvVars) return;

    // set env dependent vars for execution below
    const STRAPI_URL = environment === "local" ? LOCAL_STRAPI_URL : PRODUCTION_STRAPI_URL;
    const RPC_URL = environment === "local" ? LOCAL_RPC_URL : PRODUCTION_RPC_URL;
    const CHAIN_ID = environment === "local" ? 31337 : 137; // hardhat or matic
    const DEPLOYMENTS_FOLDER = environment === "local" ? "localhost" : "matic";
    const SNAPSHOT_BASE_FILE_PATH = process.env.SNAPSHOT_BASE_FILE_PATH;

    const riskyMessage = `Your are about to generate a liquidity mining and fees snapshot and populate data for a ${environment} strapi instance`;
    const confirm = await confirmRiskyWithMessage(riskyMessage);
    if (!confirm) {
        return;
    }
    // which epoch?
    const epochs = await fetchRewardEpochs(STRAPI_URL);
    const {chosenEpoch} = await inquirer.prompt([{
            name: "chosenEpoch",
            type: "list",
            message: `For which epoch # should the snapshots be made and records be updated in strapi (${environment})?`,
            choices: [...epochs.map((each: RewardEpochFromStrapi) => {
                return {name: `Epoch ${each.epoch} - Start: ${each.start} | End: ${each.end}`, value: each.epoch}
            })]
        }]
    );
    console.log("Chosen epoch:", chosenEpoch);

    // check if user rewards already exist for that epoch
    const userRewards = await fetchRewardUsersForEpoch(STRAPI_URL, chosenEpoch);
    console.log("userRewards count", userRewards);
    if (userRewards.length > 0) {
        console.log("User Rewards records already exist for this epoch, did you choose the correct epoch?")
        console.log("Use the reset local script if trying to repeat a dry run on local.");
        return;
    }
    // Allow hijacking when local
    let hijack = false;
    let hijackAddress = null;
    if (environment === "local") {
        const {shouldHijackLargestAddressForTesting} = await inquirer.prompt([
            {
                type: "confirm",
                message: "Do you want to hijack the data for the address with the highest amounts for testing?",
                name: "shouldHijackLargestAddressForTesting",
                default: false,
            },
        ]);
        console.log("Should hijack:", shouldHijackLargestAddressForTesting);
        if (shouldHijackLargestAddressForTesting) {
            const hijackAddressFromEnv = HIJACK_ADDRESS_FOR_TESTING || "";
            console.log("HIJACK_ADDRESS_FOR_TESTING from .env - ", hijackAddressFromEnv);
            const {shouldContinueHijack} = await inquirer.prompt([
                {
                    type: "confirm",
                    message: `Is this address correct? (Must start over if not)`,
                    name: "shouldContinueHijack",
                    default: false,
                },
            ]);
            if (!shouldContinueHijack) return;
            if (!hijackAddressFromEnv) {
                console.log("No address provided to hijack. Exiting.");
                return;
            }
            console.log(`Address confirmed. Hijacking highest amounts with address: ${hijackAddressFromEnv}`);
            hijack = true;
            hijackAddress = hijackAddressFromEnv;
        }
    }
    const epochRes = await fetch(
        `${STRAPI_URL}/reward-epoches/${chosenEpoch}`
    );

    const epochInfo: RewardEpochFromStrapi = await epochRes.json();
    ensureGoodDataFromStrapi(epochInfo);

    const {startTimestamp, endTimestamp, tokenMap} =
        cleanAndSeparateEpochPerToken(epochInfo);
    console.log("epochInfo", epochInfo);

    console.log("tokenMap", tokenMap);

    for (const tokenId of Object.keys(tokenMap)) {
        const {markets, feeTokenSupply} = tokenMap[tokenId];
        const tokenDataResponse = await fetch(`${STRAPI_URL}/reward-tokens/${tokenId}`);
        const tokenData: RewardToken = await tokenDataResponse.json();
        console.log({tokenData});
        console.log("feeTokenSupply", feeTokenSupply);
        console.log(`${tokenId} markets`, markets);
        console.log("start Date", new Date(startTimestamp));
        console.log("end Date", new Date(endTimestamp));
        const t1 = Date.now();
        const liqMap = await generateLpSnapshot(
            ReturnType.Map,
            startTimestamp,
            endTimestamp,
            markets,
            Number(DEFAULT_BLOCKS_PER_SAMPLE)
        );
        // console.log(`${tokenId} liqMap`, liqMap);
        console.log(
            `${tokenId} liqMap`,
            Object.keys(liqMap).length + " liquidity providers"
        );
        const t2 = Date.now();
        const feeMap = await generateFeesSnapshot(
            ReturnType.Map,
            startTimestamp,
            endTimestamp,
            feeTokenSupply
        );
        // console.log(`${tokenId} feeMap`, feeMap);
        console.log(
            `${tokenId} feeMap`,
            Object.keys(feeMap).length + " users who paid fees"
        );
        const t3 = Date.now();
        let currentEpochUserMap = combineMaps([
            liqMap as MapOfCount,
            feeMap as MapOfCount,
        ]);
        // console.log(`${tokenId} currentEpochUserMap`, feeMap);

        // // ------------------------------------------------
        // // ------------------------------------------------
        // // ONLY DO THIS IF YOU"RE TESTING AND DO NOT HAVE LIQUIDITY IN ANY PROD MARKETS
        // // ------------------------------------------------
        // // ------------------------------------------------
        if (hijack) {
            const addressToUse = hijackAddress;
            currentEpochUserMap = hijackAddressForTesting(
                currentEpochUserMap,
                addressToUse
            );
            console.log(
                "balance of address to use: ",
                currentEpochUserMap[addressToUse]
            );
        }
        // // ------------------------------------------------
        // // ------------------------------------------------

        console.log(
            "currentEpochUserMap",
            Object.keys(currentEpochUserMap).length + " total users"
        );
        const createMerkleRootFileName = (epoch: number, tokenSymbol: string) => {
            return `${SNAPSHOT_BASE_FILE_PATH}epoch${chosenEpoch}-token${tokenSymbol.toUpperCase()}-merkle-info.json`;
        };

        let merkleInfo: MerkleDistributorInfo;
        let prevMerkleFile: string | false;
        try {
            prevMerkleFile = fs
                .readFileSync(createMerkleRootFileName(chosenEpoch - 1, tokenData.symbol))
                .toString();
        } catch (error) {
            prevMerkleFile = false;
        }
        if (!prevMerkleFile) {
            const normalizedEarnings =
                normalizeEarningsNewFormat(currentEpochUserMap);

            console.log("normalizedEarnings length", normalizedEarnings.length);
            merkleInfo = parseBalanceMap(normalizedEarnings);

            console.log(
                "epoch 0 merkleInfo",
                BigNumber.from(merkleInfo.tokenTotal).toString()
            );
        }

        if (prevMerkleFile) {
            const mnemonic = process.env.MNEMONIC_FOR_ADMIN;
            if (!mnemonic) {
                throw new Error("No mnemonic set!");
            }

            const DISTRIBUTOR_ADDRESS = getDistributorAddress(DEPLOYMENTS_FOLDER, tokenData.symbol.toUpperCase());
            console.log("DISTRIBUTOR_ADDRESS", DISTRIBUTOR_ADDRESS);

            const provider = new providers.JsonRpcProvider(RPC_URL);
            const account = ethers.utils.HDNode.fromMnemonic(mnemonic);
            const walletWithProvider = new ethers.Wallet(account, provider);
            walletWithProvider.connect(provider);
            const signer = provider.getSigner();
            const sdk = new DistributorSdk(
                // eslint-disable-next-line
                // @ts-ignore
                signer,
                CHAIN_ID,
                "token-address-not-needed-to-freeze",
                DISTRIBUTOR_ADDRESS
            );
            try {
                const prevMerkleInfo: MerkleDistributorInfo =
                    JSON.parse(prevMerkleFile);
                const previousClaims = await sdk.getClaimedStatus(prevMerkleInfo);

                console.log(
                    "prevMerkleInfo tokenTotal",
                    BigNumber.from(prevMerkleInfo.tokenTotal).toString()
                );
                merkleInfo = combineMerkleInfo(previousClaims, currentEpochUserMap);
                //   console.log("merkleInfo", merkleInfo);
                await sdk.freeze();
                await sdk.updateMerkleRoot(merkleInfo.merkleRoot);
                await sdk.unfreeze();
            } catch (error) {
                console.log("error", error);
            }
        }
        console.log(
            "new merkleInfo tokenTotal",
            BigNumber.from(merkleInfo.tokenTotal).toString()
        );
        console.log(
            "merkleInfo",
            Object.keys(merkleInfo.claims).length + " total claims"
        );
        console.log("liq diff", t2 - t1);
        console.log("fee diff", t3 - t2);
        try {
            fs.writeFileSync(
                createMerkleRootFileName(chosenEpoch, tokenData.symbol),
                JSON.stringify(merkleInfo)
            );
        } catch (error) {
            console.log("write merkle snapshot", error);
        }

        const usersForStrapi = formatClaimsForStrapi(
            merkleInfo,
            chosenEpoch,
            Number(tokenId)
        );

        // console.log("usersForStrapi", usersForStrapi);
        const userSampleSize = 1000;
        console.log(
            "splitting user chunks into ",
            (usersForStrapi.length / userSampleSize) + " samples"
        );
        // Login to strapi
        const url = `${STRAPI_URL}/admin/login`;
        const strapiEmail = process.env.STRAPI_ADMIN_EMAIL;
        const strapiPassword = process.env.STRAPI_ADMIN_PASSWORD;
        let token;

        try {
            const loginResult = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email: strapiEmail, password: strapiPassword}),
                method: "POST"
            },);

            console.log({loginResult});

            const loginJson = await loginResult.json();

            console.log({loginJson});

            ({data: {token}} = loginJson);

        } catch (error) {
            console.log("error", error);
        }

        while (usersForStrapi.length > 0) {
            const sample = usersForStrapi.splice(0, 1000);
            try {
                // Create reward-users record as admin
                await fetch(`${STRAPI_URL}/reward-users`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(sample),
                });
            } catch (error) {
                console.log("error", error);
            }
        }
    }
})(args);
