"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const lp_snapshot_1 = require("../src/lp-snapshot");
const helpers_1 = require("../src/helpers");
const lp_helpers_1 = require("../src/lp-helpers");
const validate_env_vars_1 = require("../src/validate-env-vars");
const constants_1 = require("../src/constants");
dotenv.config();
(async () => {
    var _a;
    const CHECK_ENV_VARS = [
        "SUBGRAPH_URL",
        "STRAPI_ADMIN_EMAIL",
        "STRAPI_ADMIN_PASSWORD",
        "DEFAULT_BLOCKS_PER_SAMPLE",
        "USER_SAMPLE_SIZE",
        "STRAPI_URL",
    ];
    const validEnvVars = await validate_env_vars_1.validateEnvVars(CHECK_ENV_VARS);
    if (!validEnvVars) {
        throw new Error("Invalid Env variables!");
    }
    const userSampleSize = Number(constants_1.USER_SAMPLE_SIZE);
    if (typeof userSampleSize !== "number" || isNaN(userSampleSize)) {
        throw new Error();
    }
    let chosenEpoch;
    try {
        const numRes = await cross_fetch_1.default(`${constants_1.STRAPI_URL}/reward-epoches/count?is_active=true`);
        const numberOfActiveEpochs = await numRes.json();
        chosenEpoch = numberOfActiveEpochs - 1;
        if (typeof numberOfActiveEpochs !== "number" ||
            numberOfActiveEpochs === 0) {
            throw new Error("Invalid epoch number");
        }
    }
    catch (error) {
        console.log("Error getting Active Epoch", error);
    }
    const epochRes = await cross_fetch_1.default(`${constants_1.STRAPI_URL}/reward-epoches/${chosenEpoch}`);
    const epochInfo = await epochRes.json();
    console.log("epochInfo", epochInfo);
    lp_helpers_1.ensureGoodDataFromStrapi(epochInfo);
    const { startTimestamp, endTimestamp, tokenMap } = lp_helpers_1.cleanAndSeparateEpochPerToken(epochInfo);
    console.log("start Date", new Date(startTimestamp));
    console.log("end Date", new Date(endTimestamp));
    for (const tokenId of Object.keys(tokenMap)) {
        const { markets, feeTokenSupply } = tokenMap[tokenId];
        const tokenDataResponse = await cross_fetch_1.default(`${constants_1.STRAPI_URL}/reward-tokens/${tokenId}`);
        const tokenData = await tokenDataResponse.json();
        console.log("tokenData", tokenData);
        console.log("feeTokenSupply", feeTokenSupply);
        console.log(`markets for token #${tokenId}`, markets);
        const isUSDC = (_a = tokenData.symbol.toLowerCase() === "usdc") !== null && _a !== void 0 ? _a : false;
        // ------------------------------------------------
        // SNAPSHOT CALCULATION
        // ------------------------------------------------
        // const t1 = Date.now();
        const liqMap = await lp_snapshot_1.generateLpSnapshot(startTimestamp, endTimestamp, markets, Number(constants_1.DEFAULT_BLOCKS_PER_SAMPLE), false);
        // console.log(`${tokenId} liqMap`, liqMap);
        console.log(`${tokenId} liqMap`, Object.keys(liqMap).length + " liquidity providers");
        const estimatedRewards = helpers_1.formatEstimatedRewards(liqMap, chosenEpoch, Number(tokenId), isUSDC);
        console.log("estimatedRewards: ", estimatedRewards.length);
        // console.log("liq diff", t2 - t1);
        // console.log("fee diff", t3 - t2);
        // ------------------------------------------------
        // STRAPI
        // ------------------------------------------------
        console.log("splitting user chunks into ", estimatedRewards.length / userSampleSize + " samples");
        // Login to strapi
        const url = `${constants_1.STRAPI_URL}/admin/login`;
        let token;
        try {
            const loginResult = await cross_fetch_1.default(url, {
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: constants_1.STRAPI_ADMIN_EMAIL,
                    password: constants_1.STRAPI_ADMIN_PASSWORD,
                }),
                method: "POST",
            });
            console.log({ loginResult });
            const loginJson = await loginResult.json();
            console.log({ loginJson });
            token = loginJson.data.token;
        }
        catch (error) {
            console.log("error", error);
        }
        console.log("token 2", token);
        while (estimatedRewards.length > 0) {
            const sample = estimatedRewards.splice(0, userSampleSize);
            console.log("sample", sample);
            try {
                // Create reward-users record as admin
                const response = await cross_fetch_1.default(`${constants_1.STRAPI_URL}/reward-users`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(sample),
                });
                console.log({ response });
                // console.log("responseJson", await response.json());
            }
            catch (error) {
                console.log("error", error);
            }
        }
    }
})();
