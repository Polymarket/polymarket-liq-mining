import * as dotenv from "dotenv";
import fetch from "cross-fetch";
import inquirer from "inquirer";
import { Contract, ethers } from "ethers";
import { validateEnvVars } from "../src/validate-env-vars";
import { usdcAbi } from "./abis/usdc";
import { multicallAbi } from "./abis/multicall";

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

// IMPORTANT NOTE:
// --------------------------------------------------------------------------------------

// Polygon USD Coin (PoS), USDC, or any of bridged Polygon tokens are not EIP-3009 compatible.

// They have transferWithAuthorization function, but you need to use a different EIP-712 message for signing. See here for more details.

// EIP-3009:

// EIP712Domain: [
//   { name: 'name', type: 'string' },
//   { name: 'version', type: 'string' },
//   { name: 'chainId', type: 'uint256' },
//   { name: 'verifyingContract', type: 'address' }
// ]
// Polygon:

// EIP712Domain: [
//   { name: 'name', type: 'string' },
//   { name: 'version', type: 'string' },
//   { name: 'verifyingContract', type: 'address' },
//   { name: 'salt', type: 'bytes32' }
// ]

const transferTokens = async () => {
    const PRIV_KEY = process.env.PRIV_KEY;
    const RPC_URL = process.env.RPC_URL;

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL as string);
    const wallet = new ethers.Wallet(PRIV_KEY as string);

    console.log("Wallet address", wallet.address);

    const signer = wallet.connect(provider);

    const usdc = new ethers.Contract(
        "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
        usdcAbi,
        signer,
    );

    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const nonce = ethers.utils.randomBytes(32);

    const data = {
        types: {
            TransferWithAuthorization: [
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
                { name: "validAfter", type: "uint256" },
                { name: "validBefore", type: "uint256" },
                { name: "nonce", type: "bytes32" },
            ],
        },
        domain: {
            name: "USD Coin (PoS)",
            version: "1",
            verifyingContract: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            salt: ethers.utils.hexZeroPad(
                ethers.BigNumber.from(137).toHexString(),
                32,
            ),
        },
        primaryType: "TransferWithAuthorization",
        message: {
            from: "0x1ce89f5a40374dd57cebd37f325e9a022804e133",
            to: "0x1ce89f5a40374dd57cebd37f325e9a022804e133",
            value: 1000000,
            validAfter: 0,
            validBefore: expiry, // Valid for an hour
            nonce: nonce,
        },
    };

    const signature = await signer._signTypedData(
        data.domain,
        data.types,
        data.message,
    );

    const v = ethers.utils.splitSignature(signature).v;
    const r = ethers.utils.splitSignature(signature).r;
    const s = ethers.utils.splitSignature(signature).s;

    const multicall = new ethers.Contract(
        "0xcA11bde05977b3631167028862bE2a173976CA11",
        multicallAbi,
        signer,
    );

    const transferWithAuthCall = {
        target: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        allowFailure: false,
        callData: usdc.interface.encodeFunctionData(
            "transferWithAuthorization",
            [
                "0x1ce89f5a40374dd57cebd37f325e9a022804e133",
                "0x1ce89f5a40374dd57cebd37f325e9a022804e133",
                1000000,
                0,
                expiry,
                nonce,
                v,
                r,
                s,
            ],
        ),
    };

    const transaction = await multicall.aggregate([transferWithAuthCall]);
    console.log(transaction.hash);

    // const transfer = await usdc.transferWithAuthorization(
    //     "0x1ce89f5a40374dd57cebd37f325e9a022804e133",
    //     "0x1ce89f5a40374dd57cebd37f325e9a022804e133",
    //     1000000,
    //     0,
    //     expiry,
    //     nonce,
    //     v,
    //     r,
    //     s,
    //     {
    //         gasPrice: 100_000_000_000,
    //         gasLimit: 200_000,
    //     },
    // );
    // console.log(transfer.hash);
};

(async () => {
    //await transferTokensTwo();
    await transferTokens();
    const CHECK_ENV_VARS = ["CONTESTS_API_URL"];
    const validEnvVars = await validateEnvVars(CHECK_ENV_VARS);
    if (!validEnvVars) return;

    const contestUrl = process.env.CONTESTS_API_URL;

    const contests = await (await fetch(`${contestUrl}/contests`)).json();

    const { chosenContest } = await inquirer.prompt([
        {
            name: "chosenContest",
            type: "list",
            message: "Choose a contest to payout",
            choices: [
                ...contests.map((contest: any) => {
                    return contest.contestID;
                }),
            ],
        },
    ]);
    console.log("Chosen contest", chosenContest);

    let contestInfo;
    for (let i = 0; i < contests.length; i++) {
        if (contests[i].contestID === chosenContest) {
            contestInfo = {
                contestId: contests[i].contestID,
                contestType: contests[i].contestType,
                state: contests[i].state,
                prizes: contests[i].prizes,
            };
            break;
        }
    }

    if (contestInfo.state !== "STATE_COMPLETED") {
        const riskyMessage = `The contests you selected is not completed and in the state ${contestInfo.state}. Are you sure you want to continue?`;
        const confirm = await confirmRiskyWithMessage(riskyMessage);
        if (!confirm) {
            return;
        }
    }

    const contest = await (
        await fetch(
            `${contestUrl}/contest?contestid=${contestInfo.contestId}&type=${contestInfo.contestType}`,
        )
    ).json();

    const totalToDistribute = contestInfo.prizes.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0,
    );

    const riskyMessage = `You're about to distribute $${totalToDistribute} in payouts to ${contestInfo.prizes.length} addresses, do you wish to proceed?`;
    const confirm = await confirmRiskyWithMessage(riskyMessage);
    if (!confirm) {
        return;
    }

    await transferTokens();

    // use open zeppelin to send transactions
})();
