import * as dotenv from "dotenv";
import fetch from "cross-fetch";
import { generateLpSnapshot } from "../src/lp-snapshot";
import { formatEstimatedRewards } from "../src/helpers";
import {
    RewardEpochFromStrapi,
    ensureGoodDataFromStrapi,
    cleanAndSeparateEpochPerToken,
    RewardToken,
} from "../src/lp-helpers";
import { validateEnvVars } from "../src/validate-env-vars";
import {
    DEFAULT_BLOCKS_PER_SAMPLE,
    STRAPI_URL,
    USER_SAMPLE_SIZE,
    STRAPI_ADMIN_EMAIL,
    STRAPI_ADMIN_PASSWORD,
} from "../src/constants";

dotenv.config();

(async () => {
    const CHECK_ENV_VARS = [
        "SUBGRAPH_URL",
        "STRAPI_ADMIN_EMAIL",
        "STRAPI_ADMIN_PASSWORD",
        "DEFAULT_BLOCKS_PER_SAMPLE",
        "USER_SAMPLE_SIZE",
        "STRAPI_URL",
		"MATIC_RPC_URL"
    ];

    const validEnvVars = await validateEnvVars(CHECK_ENV_VARS);
    if (!validEnvVars) {
        throw new Error("Invalid Env variables!");
    }

    const userSampleSize = Number(USER_SAMPLE_SIZE);
    if (typeof userSampleSize !== "number" || isNaN(userSampleSize)) {
        throw new Error();
    }

    let chosenEpoch;

    try {
        const numRes = await fetch(
            `${STRAPI_URL}/reward-epoches/count?is_active=true`,
        );
        const numberOfActiveEpochs = await numRes.json();
        chosenEpoch = numberOfActiveEpochs - 1;

        if (
            typeof numberOfActiveEpochs !== "number" ||
            numberOfActiveEpochs === 0
        ) {
            throw new Error("Invalid epoch number");
        }
    } catch (error) {
        console.log("Error getting Active Epoch", error);
    }

    const epochRes = await fetch(`${STRAPI_URL}/reward-epoches/${chosenEpoch}`);

    const epochInfo: RewardEpochFromStrapi = await epochRes.json();
    console.log("epochInfo", epochInfo);

    ensureGoodDataFromStrapi(epochInfo);

    const { startTimestamp, endTimestamp, tokenMap } =
        cleanAndSeparateEpochPerToken(epochInfo);

    console.log("start Date", new Date(startTimestamp));
    console.log("end Date", new Date(endTimestamp));

    for (const tokenId of Object.keys(tokenMap)) {
        const { markets, feeTokenSupply } = tokenMap[tokenId];
        const tokenDataResponse = await fetch(
            `${STRAPI_URL}/reward-tokens/${tokenId}`,
        );
        const tokenData: RewardToken = await tokenDataResponse.json();
        console.log("tokenData", tokenData);
        console.log("feeTokenSupply", feeTokenSupply);
        console.log(`markets for token #${tokenId}`, markets);
        const isUSDC = tokenData.symbol.toLowerCase() === "usdc" ?? false;

        // ------------------------------------------------
        // SNAPSHOT CALCULATION
        // ------------------------------------------------

        // const t1 = Date.now();
        const liqMap = await generateLpSnapshot(
            startTimestamp,
            endTimestamp,
            markets,
            Number(DEFAULT_BLOCKS_PER_SAMPLE),
            false, // dont throw error if block mismatch
        );
        // console.log(`${tokenId} liqMap`, liqMap);
        console.log(
            `${tokenId} liqMap`,
            Object.keys(liqMap).length + " liquidity providers",
        );

        const estimatedRewards = formatEstimatedRewards(
            liqMap,
            chosenEpoch,
            Number(tokenId),
            isUSDC,
        );

        console.log("estimatedRewards: ", estimatedRewards.length);

        // console.log("liq diff", t2 - t1);
        // console.log("fee diff", t3 - t2);

        // ------------------------------------------------
        // STRAPI
        // ------------------------------------------------

        console.log(
            "splitting user chunks into ",
            estimatedRewards.length / userSampleSize + " samples",
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
            token = loginJson.data.token;
        } catch (error) {
            console.log("error", error);
        }
        console.log("token 2", token);
        while (estimatedRewards.length > 0) {
            const sample = estimatedRewards.splice(0, userSampleSize);
            console.log("sample", sample);
            try {
                // Create reward-users record as admin
                const response = await fetch(`${STRAPI_URL}/reward-users`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(sample),
                });
                console.log({ response });
                // console.log("responseJson", await response.json());
            } catch (error) {
                console.log("error", error);
            }
        }
    }
})();
