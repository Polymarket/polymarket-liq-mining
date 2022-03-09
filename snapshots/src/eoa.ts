import { queryGqlClient } from "./gql_client";
import { getProvider } from "./provider";
import * as queries from "./queries";
import { TransactionReceipt } from "@ethersproject/providers";
import { ethers } from "ethers";
import { TxnRelayedEventAbiFragment } from "./relayHubAbi";
import * as fs from "fs";
// import { ReturnSnapshot } from "./interfaces";
// import { batch } from "promises-tho";

const RELAY_HUB_ADDRESS = "0xD216153c06E857cD7f72665E0aF1d7D82172F494";
const RElAY_HUB_INTERFACE = new ethers.utils.Interface(
    TxnRelayedEventAbiFragment,
);

const TXN_RELAY_EVENT_TOPIC_HASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
        "TransactionRelayed(address,address,address,bytes4,uint8,uint256)",
    ),
);

async function isEOA(address: string): Promise<boolean> {
    const provider = getProvider();
    const codeAtAddress = await provider.getCode(address);
    return codeAtAddress === "0x";
}

async function getRelayHubReceipt(
    transactionHash: string,
): Promise<TransactionReceipt> {
    const provider = getProvider();
    const transactionReceipt = await provider.getTransactionReceipt(
        transactionHash,
    );
    if (
        transactionReceipt != null &&
        transactionReceipt.to != null &&
        transactionReceipt.to == RELAY_HUB_ADDRESS
    ) {
        return transactionReceipt;
    }
    return null;
}

async function getTransactionHashes(address: string): Promise<string[]> {
    // eslint-disable-next-line no-useless-catch
    let retryCount = 0;
    const { tries, startMs, pow, maxMs, jitter } = {
        tries: 3,
        startMs: 500,
        pow: 3,
        maxMs: 300000,
        jitter: 0.25,
    };

    while (retryCount < tries) {
        try {
            const transactionHashes = [];

            const { data } = await queryGqlClient(
                queries.allTransactionsPerUserQuery,
                {
                    user: address,
                },
            );

            data.transactions.map((el) => transactionHashes.push(el.id));
            data.fpmmFundingAdditions.map((el) =>
                transactionHashes.push(el.id),
            );
            return transactionHashes;
        } catch (err) {
            console.log(
                "\n\n\n\n\n\n",
                "address",
                address,
                "retryCount",
                retryCount,
                "\n\n\n\n\n\n",
            );

            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) =>
                setTimeout(res, delay - Math.random() * delay * jitter),
            );
        }
    }

    console.log(
        "\n\n\n\n\n\ngetTransactionHashes-Retry count exceeded",
        "address",
        address,
        "\n\n\n\n\n\n",
    );
}

const eoaCacheFilename = "./proxy-wallet-to-eoa.json";

function getEoaCache() {
    let eoaCache;
    try {
        eoaCache = JSON.parse(fs.readFileSync(eoaCacheFilename).toString());
    } catch (error) {
        eoaCache = {};
    }
    return eoaCache;
}

export const updateEoaCacheFromSnapshot = (
    snapshot: { eoaWallet: string | null; proxyWallet: string }[],
): void => {
    const newCache = snapshot.reduce((acc, curr) => {
        if (!acc[curr.proxyWallet] && curr.eoaWallet) {
            acc[curr.proxyWallet] = curr.eoaWallet;
        }
        return acc;
    }, {});
    batchUpdateEoaCache(newCache);
};

export const batchUpdateEoaCache = (newCache: {
    [key: string]: string;
}): void => {
    const oldCache = getEoaCache();
    console.log(
        `Batch updating eoa cache of ${Object.keys(oldCache).length} eoa with ${
            Object.keys(newCache).length
        } new eoa's`,
    );
    writeToEoaCache({ ...oldCache, ...newCache });
};

export function writeToEoaCache(newCache: { [key: string]: string }): void {
    try {
        fs.writeFileSync(eoaCacheFilename, JSON.stringify(newCache));
    } catch (error) {
        console.log("writeToEoaCache error", error);
    }
}

export const eoaCache = getEoaCache();

/**
 * Gets the corresponding eoa address for a proxy wallet address
 * Fetches the address from a pre-populated cache.
 * Falls back to the subgraph and RPC provider if the address is not found
 * @param address
 * @returns
 */
export const fetchEoaAddress = async (address: string): Promise<string> => {
    let eoaAddress = eoaCache[address];
    console.log("eoa in cache - ", eoaAddress);
    if (!eoaAddress) {
        try {
            eoaAddress = await getEoaLinkAddress(address);
            if (eoaAddress) {
                console.log(
                    "Updating eoa cache in fetchEoaAddress! " + eoaAddress,
                );
                writeToEoaCache({ ...eoaCache, [address]: eoaAddress });
            }
        } catch (error) {
            console.log("fetchEoaAddress error", error);
            return eoaAddress;
        }
    }
    return eoaAddress;
};

/**
 * Gets the corresponding eoa link address for a proxy wallet
 * Queries the subgraph and a Matic RPC provider for TransactionRelayed event logs, which index the eoa address
 * @param address: string
 * @returns eoaAddress: string
 */
export const getEoaLinkAddress = async (address: string): Promise<string> => {
    if (await isEOA(address)) {
        return address;
    }

    const transactionHashes: string[] = await getTransactionHashes(address);
    for (const transactionHash of transactionHashes) {
        const transactionReceipt: TransactionReceipt = await getRelayHubReceipt(
            transactionHash,
        );
        if (transactionReceipt != null) {
            for (const log of transactionReceipt.logs) {
                //First topic is always a hash of the signature of the event
                const topicHash = log.topics[0];
                if (topicHash == TXN_RELAY_EVENT_TOPIC_HASH) {
                    const txnRelayedEvent = RElAY_HUB_INTERFACE.parseLog(log);
                    const eoaAddress = txnRelayedEvent.args.from;
                    return eoaAddress;
                }
            }
        }
    }
    return null;
};
