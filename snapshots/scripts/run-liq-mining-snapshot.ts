import * as dotenv from "dotenv";
import fetch from "cross-fetch";
import inquirer from "inquirer";
import { generateLpSnapshot } from "../src/lp-snapshot";
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
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { MapOfCount } from "../src/interfaces";
import {
    RewardEpochFromStrapi,
    ensureGoodDataFromStrapi,
    cleanAndSeparateEpochPerToken,
    RewardToken,
} from "../src/lp-helpers";
import { BigNumber, ethers, providers } from "ethers";
import { DistributorSdk } from "../../sdk/src/distributorSdk";
import { validateEnvVars } from "../src/validate-env-vars";
import { fetchRewardEpochs } from "../src/strapi-helpers";
import {
    DEFAULT_BLOCKS_PER_SAMPLE,
    HIJACK_ADDRESS_FOR_TESTING,
    LOCAL_RPC_URL,
    LOCAL_STRAPI_URL,
    PRODUCTION_RPC_URL,
    PRODUCTION_STRAPI_URL,
    STRAPI_ADMIN_EMAIL,
    STRAPI_ADMIN_PASSWORD, 
    PGHOST, 
    PGPORT, 
    PGDATABASE, 
    PGUSER, 
    PGPASSWORD 
} from "../src/constants";
import * as pg from 'node-postgres'
import { doQuery, generateSQLFeesSnapshot, getClient, getSQLFees } from "../src/sql_fees"
import { TransactionDescription } from "ethers/lib/utils";

dotenv.config();

const confirmRiskyWithMessage = async (message: string) => {
    const { confirm } = await inquirer.prompt([
        {
            type: "confirm",
            message,
            name: "confirm",
            default: false,
        },
    ]);
    return confirm;
};

const createMerkleRootFileName = (
    baseFilePath: string,
    epoch: number,
    tokenSymbol: string,
) => {
    return `${baseFilePath}epoch${epoch}-token${tokenSymbol.toUpperCase()}-merkle-info.json`;
};

(async () => {
    // check standard env vars and error if not set
    const CHECK_ENV_VARS = [
        "SUBGRAPH_URL",
        "STRAPI_ADMIN_EMAIL",
        "STRAPI_ADMIN_PASSWORD",
        "DEFAULT_BLOCKS_PER_SAMPLE",
        "SNAPSHOT_BASE_FILE_PATH",
    ];
    const validEnvVars = await validateEnvVars(CHECK_ENV_VARS);
    if (!validEnvVars) return;
    // local or production
    //put code here to test asap




    //
    const { environment } = await inquirer.prompt([
        {
            name: "environment",
            type: "list",
            message: "Should this snapshot affect local or production strapi?",
            choices: [
                { name: `local`, value: "local" },
                { name: `production`, value: "production" },
            ],
        },
    ]);
    console.log("Environment:", environment);

    // check relevant env vars before continuing
    const validProdEnvVars = await validateEnvVars([
        "PRODUCTION_STRAPI_URL",
        "MATIC_RPC_URL",
    ]);
    const validLocalEnvVars = await validateEnvVars(["LOCAL_RPC_URL"]);
    if (environment === "local" && !validLocalEnvVars) return;
    if (environment !== "local" && !validProdEnvVars) return;

    // set env dependent vars for execution below
    const STRAPI_URL =
        environment === "local" ? LOCAL_STRAPI_URL : PRODUCTION_STRAPI_URL;

    const RPC_URL =
        environment === "local" ? LOCAL_RPC_URL : PRODUCTION_RPC_URL;

    const CHAIN_ID = environment === "local" ? 31337 : 137; // hardhat or matic
    // const DEPLOYMENTS_FOLDER = environment === "local" ? "localhost" : "matic";
    const SNAPSHOT_BASE_FILE_PATH = process.env.SNAPSHOT_BASE_FILE_PATH;
	console.log('DEFAULT_BLOCKS_PER_SAMPLE', DEFAULT_BLOCKS_PER_SAMPLE)

    const riskyMessage = `You're about to generate a liquidity mining and fees snapshot and populate data for a ${environment} strapi instance`;
    const confirm = await confirmRiskyWithMessage(riskyMessage);
    if (!confirm) {
        return;
    }
    // which epoch?
    const epochs = await fetchRewardEpochs(STRAPI_URL);
    const { chosenEpoch } = await inquirer.prompt([
        {
            name: "chosenEpoch",
            type: "list",
            message: `For which epoch # should the snapshots be made and records be updated in strapi (${environment})?`,
            choices: [
                ...epochs.map((each: RewardEpochFromStrapi) => {
                    return {
                        name: `Epoch ${each.epoch} - Start: ${each.start} | End: ${each.end}`,
                        value: each.epoch,
                    };
                }),
            ],
        },
    ]);
    console.log("Chosen epoch:", chosenEpoch);
    
    // Allow hijacking when local
    let hijack = false;
    let hijackAddress = null;
    if (environment === "local") {
        const { shouldHijackLargestAddressForTesting } = await inquirer.prompt([
            {
                type: "confirm",
                message:
                    "Do you want to hijack the data for the address with the highest amounts for testing?",
                name: "shouldHijackLargestAddressForTesting",
                default: false,
            },
        ]);
        console.log("Should hijack:", shouldHijackLargestAddressForTesting);
        if (shouldHijackLargestAddressForTesting) {
            const hijackAddressFromEnv = HIJACK_ADDRESS_FOR_TESTING || "";
            console.log(
                "HIJACK_ADDRESS_FOR_TESTING from .env - ",
                hijackAddressFromEnv,
            );
            const { shouldContinueHijack } = await inquirer.prompt([
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
            console.log(
                `Address confirmed. Hijacking highest amounts with address: ${hijackAddressFromEnv}`,
            );
            hijack = true;
            hijackAddress = hijackAddressFromEnv;
        }
    }
    const epochRes = await fetch(`${STRAPI_URL}/reward-epoches/${chosenEpoch}`);

    const epochInfo: RewardEpochFromStrapi = await epochRes.json();
    ensureGoodDataFromStrapi(epochInfo);

    const { startTimestamp, endTimestamp, tokenMap } =
        cleanAndSeparateEpochPerToken(epochInfo);
    console.log("epochInfo", epochInfo);
    for (const tokenId of Object.keys(tokenMap)) {
        const { markets, feeTokenSupply } = tokenMap[tokenId];
        const tokenDataResponse = await fetch(
            `${STRAPI_URL}/reward-tokens/${tokenId}`,
        );
        const tokenData: RewardToken = await tokenDataResponse.json();
        console.log({ tokenData });
        console.log("feeTokenSupply", feeTokenSupply);
        console.log(`markets for token #${tokenId}`, markets);
        console.log("start Date", new Date(startTimestamp));
        console.log("end Date", new Date(endTimestamp));
        const isUSDC = tokenData.symbol.toLowerCase() === "usdc" ?? false;

        // ------------------------------------------------
        // SDK
        // ------------------------------------------------
        let sdk: DistributorSdk;
        let merkleInfo: MerkleDistributorInfo;

        try {
            const mnemonic = process.env.MNEMONIC_FOR_ADMIN;
            if (!mnemonic) {
                throw new Error("No mnemonic set!");
            }

            const provider = new providers.JsonRpcProvider(RPC_URL);
            const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
            const firstAccount = hdNode.derivePath(`m/44'/60'/0'/0/0`);
            const signer = new ethers.Wallet(firstAccount.privateKey, provider);

            sdk = new DistributorSdk(
                // eslint-disable-next-line
                // @ts-ignore
                signer,
                CHAIN_ID,
                tokenData.symbol.toLowerCase(),
            );

            console.log({
                provider,
                // account,
                signer,
                sdk,
            });
        } catch (error) {
            console.log(`Error instantiating SDK: ${error}`);
        }

        // ------------------------------------------------
        // SNAPSHOT CALCULATION
        // ------------------------------------------------

        const { shouldGenerateSnapshot } = await inquirer.prompt([
            {
                type: "confirm",
                message: `Do you want to generate snapshots`,
                name: "shouldGenerateSnapshot",
                default: false,
            },
        ]);

        if (shouldGenerateSnapshot) {
            const { shouldFailOnBlockMismatch } = await inquirer.prompt([
                {
                    type: "confirm",
                    message: `Should the script throw an error and stop running if event blocks are in the wrong order?`,
                    name: "shouldFailOnBlockMismatch",
                    default: true,
                },
            ]);

            const { shouldMemoizeMarketInfo } = await inquirer.prompt([
                {
                    type: "confirm",
                    message: `Should we read and write markets lp info from local file system as the script runs`,
                    name: "shouldMemoizeMarketInfo",
                    default: true,
                },
            ]);

            const client = getClient(PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD);
            await client.connect()
            .then(() => console.log('connected'))
            .catch(err => console.error('connection error', err.stack))
            let mapAccountsFees = new Map<string, number>();
            const sampleSize = 50;
            for (let i = 0; i < 450/sampleSize; i++) {
                console.log(i);
                const query = `with avg_price_tbl AS (SELECT CAST("tradeAmount" AS FLOAT)/CAST("outcomeTokensAmount" AS FLOAT) AS "avg_price", * FROM "Transactions"
                WHERE "timestamp" >= '${epochs[chosenEpoch].start}' AND "timestamp" <= '${epochs[chosenEpoch].end}' AND "outcomeTokensAmount" > 0
                ), sub_tbl AS (
                SELECT ROW_NUMBER() OVER(ORDER BY "account" ASC) AS "row", "account", SUM("feeAmount")/10^6 AS "totalFeeAmount" FROM "avg_price_tbl"
                WHERE "avg_price" <=0.98
                GROUP BY "account"
                ORDER BY "totalFeeAmount" DESC)
                SELECT * FROM "sub_tbl" 
                WHERE "row" >= ${i * sampleSize} AND "row" < ${(i+1) * sampleSize}`
                const mapAccountsFeesTemp = await doQuery(query, client);
                mapAccountsFees = new Map([...mapAccountsFees, ...mapAccountsFeesTemp])
                await new Promise(r => setTimeout(r, 2000));
            }
            client.end();
            console.log("fee token supply number", feeTokenSupply);
            const fees = await getSQLFees(mapAccountsFees);
            const feeMap = await generateSQLFeesSnapshot(fees, feeTokenSupply);

            console.log(`${tokenId} feeMap`, feeMap)
            console.log(
                `${tokenId} feeMap`,
                Object.keys(feeMap).length + " users who paid fees",
            )

            const t1 = Date.now();
            const liqMap = await generateLpSnapshot(
                startTimestamp,
                endTimestamp,
                markets,
                Number(DEFAULT_BLOCKS_PER_SAMPLE),
                shouldFailOnBlockMismatch,
                shouldMemoizeMarketInfo
                    ? {
                          epoch: chosenEpoch,
                          tokenSymbol: tokenData.symbol.toUpperCase(),
                      }
                    : undefined,
            );

            // console.log(`${tokenId} liqMap`, liqMap);
            console.log(
                `${tokenId} liqMap`,
                Object.keys(liqMap).length + " liquidity providers",
            );
            const t2 = Date.now();
            // const feeMap = await generateFeesSnapshot(
            //     startTimestamp,
            //     endTimestamp,
            //     feeTokenSupply,
            // );
            // console.log(`${tokenId} feeMap`, feeMap);
            // console.log(
            //     `${tokenId} feeMap`,
            //     Object.keys(feeMap).length + " users who paid fees",
            // );
            const t3 = Date.now();
            let currentEpochUserMap = combineMaps([
                liqMap as MapOfCount,
                feeMap as MapOfCount,
            ]);

            // // ------------------------------------------------
            // // ------------------------------------------------
            // // ONLY DO THIS IF YOU"RE TESTING AND DO NOT HAVE LIQUIDITY IN ANY PROD MARKETS
            // // ------------------------------------------------
            // // ------------------------------------------------
            if (hijack) {
                const addressToUse = hijackAddress;
                currentEpochUserMap = hijackAddressForTesting(
                    currentEpochUserMap,
                    addressToUse,
                );
                console.log(
                    "balance of address to use: ",
                    currentEpochUserMap[addressToUse],
                );
            }
            // // ------------------------------------------------
            // // ------------------------------------------------

            console.log(
                "currentEpochUserMap",
                Object.keys(currentEpochUserMap).length + " total users",
            );

            let prevMerkleFile: string | false;

            try {
                prevMerkleFile = fs
                    .readFileSync(
                        createMerkleRootFileName(
                            SNAPSHOT_BASE_FILE_PATH,
                            chosenEpoch - 1,
                            tokenData.symbol,
                        ),
                    )
                    .toString();
            } catch (error) {
                console.log("no prevMerkleFile found!");
                prevMerkleFile = false;
            }

            if (!prevMerkleFile) {
                const normalizedEarnings = normalizeEarningsNewFormat(
                    currentEpochUserMap,
                    isUSDC,
                );

                console.log(
                    "normalizedEarnings length",
                    normalizedEarnings.length,
                );
                merkleInfo = parseBalanceMap(normalizedEarnings);

                console.log(
                    "epoch 0 merkleInfo",
                    BigNumber.from(merkleInfo.tokenTotal).toString(),
                );
            }

            if (prevMerkleFile) {
                if (!sdk) {
                    throw new Error(
                        "SDK must be instantiated to getClaimedStatus!",
                    );
                }
                try {
                    const prevMerkleInfo: MerkleDistributorInfo =
                        JSON.parse(prevMerkleFile);
                    console.log(
                        "prevMerkleInfo tokenTotal",
                        BigNumber.from(prevMerkleInfo.tokenTotal).toString(),
                    );
                    const previousClaims = await sdk.getClaimedStatus(
                        prevMerkleInfo,
                    );
                    console.log("previousClaims", previousClaims);
                    console.log("merkleInfo", merkleInfo);

                    merkleInfo = combineMerkleInfo(
                        previousClaims,
                        currentEpochUserMap,
                        isUSDC,
                    );
                } catch (error) {
                    console.log("error", error);
                }
            }

            console.log(
                "new merkleInfo tokenTotal",
                BigNumber.from(merkleInfo.tokenTotal).toString(),
            );
            console.log(
                "merkleInfo",
                Object.keys(merkleInfo.claims).length + " total claims",
            );
            console.log("liq diff", t2 - t1);
            console.log("fee diff", t3 - t2);
            try {
                fs.writeFileSync(
                    createMerkleRootFileName(
                        SNAPSHOT_BASE_FILE_PATH,
                        chosenEpoch,
                        tokenData.symbol,
                    ),
                    JSON.stringify(merkleInfo),
                );
            } catch (error) {
                console.log("write merkle snapshot", error);
            }

            if (shouldMemoizeMarketInfo) {
                // todo - see how many files are in directory. delete if necessary
            }
        }

        // ------------------------------------------------
        // PULL MERKLE INFO FROM DISK
        // ------------------------------------------------

        const { shouldPullMerkleInfoFromDisk } = await inquirer.prompt([
            {
                type: "confirm",
                message: `Do you want to pull epoch #${chosenEpoch} from disk (assuming you already calculated it?)`,
                name: "shouldPullMerkleInfoFromDisk",
                default: false,
            },
        ]);

        if (shouldPullMerkleInfoFromDisk) {
            try {
                const file = fs
                    .readFileSync(
                        createMerkleRootFileName(
                            SNAPSHOT_BASE_FILE_PATH,
                            chosenEpoch,
                            tokenData.symbol,
                        ),
                    )
                    .toString();

                merkleInfo = JSON.parse(file);
            } catch (error) {
                console.log(
                    "no merkle info for chosen epoch found, write one!",
                );
            }
        }

        // ------------------------------------------------
        // STRAPI
        // ------------------------------------------------

        if (merkleInfo) {
            const { shouldUpdateStrapi } = await inquirer.prompt([
                {
                    type: "confirm",
                    message: `Do you want to update ${
                        Object.keys(merkleInfo.claims).length
                    } reward-users to Strapi for ${chosenEpoch}?`,
                    name: "shouldUpdateStrapi",
                    default: false,
                },
            ]);

            if (shouldUpdateStrapi) {
                const usersForStrapi = formatClaimsForStrapi(
                    merkleInfo,
                    chosenEpoch,
                    Number(tokenId),
                );
                console.log("usersForStrapi", usersForStrapi);
                const userSampleSize = 1000;
                console.log(
                    "splitting user chunks into ",
                    usersForStrapi.length / userSampleSize + " samples",
                );
                // Login to strapi
                const url = `${STRAPI_URL}/admin/login`;

                let token;
                try {
                    const loginResult = await fetch(url, {
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: STRAPI_ADMIN_EMAIL,
                            password: STRAPI_ADMIN_PASSWORD,
                        }),
                        method: "POST",
                    });
                    console.log({ loginResult });
                    const loginJson = await loginResult.json();
                    console.log({ loginJson });
                    ({
                        data: { token },
                    } = loginJson);
                } catch (error) {
                    console.log("error", error);
                }
                console.log("token 2", token);
                while (usersForStrapi.length > 0) {
                    const sample = usersForStrapi.splice(0, userSampleSize);
                    // console.log("sample", sample);
                    try {
                        // Create reward-users record as admin
                        const response = await fetch(
                            `${STRAPI_URL}/reward-users`,
                            {
								method: "PUT",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify(sample),
                            },
                        );
                        console.log({ response });
                        // console.log("responseJson", await response.json());
                    } catch (error) {
                        console.log("error", error);
                    }
                }
            }
        }

        // ------------------------------------------------
        // MERKLE ROOT
        // ------------------------------------------------

        console.log({ sdk });
        if (sdk && merkleInfo && merkleInfo.merkleRoot) {
            const { shouldUpdateMerkleRoot } = await inquirer.prompt([
                {
                    type: "confirm",
                    message: `Do you want to update the merkle root to: ${merkleInfo.merkleRoot}`,
                    name: "shouldUpdateMerkleRoot",
                    default: false,
                },
            ]);
            if (shouldUpdateMerkleRoot) {
                sdk.freeze()
                    .then((freezeTx) => {
                        console.log("freezeTx", freezeTx);
                        return sdk.updateMerkleRoot(merkleInfo.merkleRoot);
                    })
                    .then((updateMerkleRootTx) => {
                        console.log("updateMerkleRootTx", updateMerkleRootTx);
                        return sdk.unfreeze();
                    })
                    .then((unfreezeTx) => {
                        console.log("unfreezeTx", unfreezeTx);
                        return true;
                    })
                    .catch((err) => {
                        console.log("error updating merkle root", err);
                    });
            }
        }
    }
})();
