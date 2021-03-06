import { batch } from "promises-tho";
import { queryGqlClient } from "./gql_client";
import * as queries from "./queries";

const SCALE_FACTOR = Math.pow(10, 6);

/**
 * Calculates total trade volume for an address, given a timestamp snapshot
 *
 * @param addresses
 * @param timestamp
 * @returns
 */
const getTradeVolumePerUser = async (
    address: string,
    timestamp: number,
): Promise<number> => {
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
            let lastId = "";
            let tradeVolume = 0;
            const search = true;
            while (search) {
                const { data } = await queryGqlClient(
                    queries.getTradeVolumePerUserQuery,
                    {
                        lastId: lastId,
                        user: address,
                        timestamp: `${timestamp}`,
                    },
                );

                if (data.transactions.length == 0) {
                    break;
                }

                for (const txn of data.transactions) {
                    tradeVolume += parseInt(txn.tradeAmount);
                }
                lastId = data.transactions[data.transactions.length - 1].id;
            }
            return tradeVolume / SCALE_FACTOR;
        } catch (err) {
            console.log(
                "\n",
                "address",
                address,
                "timestamp",
                timestamp,
                "retryCount",
                retryCount,
                "\n",
            );

            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) =>
                setTimeout(res, delay - Math.random() * delay * jitter),
            );
        }
    }

    console.log(
        "\n\n\n\n\n\ngetTradeVolumePerUser-Retry count exceeded",
        "address",
        address,
        "timestamp",
        timestamp,
        "\n\n\n\n\n\n",
    );
};

const getFeesPerUser = async (
    address: string,
    startTimestamp: number,
    endTimestamp: number,
): Promise<number> => {
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
            let lastId = "";
            let fees = 0;
            const search = true;
            while (search) {
                const { data } = await queryGqlClient(
                    queries.getFeesPaidPerUserQuery,
                    {
                        lastId: lastId,
                        user: address,
                        startTimestamp: `${startTimestamp}`,
                        endTimestamp: `${endTimestamp}`,
                    },
                );

                if (data.transactions.length == 0) {
                    break;
                }

                for (const txn of data.transactions) {
                    fees += parseInt(txn.feeAmount);
                }
                lastId = data.transactions[data.transactions.length - 1].id;
            }
            return fees / SCALE_FACTOR;
        } catch (err) {
            console.log(
                "\n",
                "address",
                address,
                "startTimestamp",
                startTimestamp,
                "endTimestamp",
                endTimestamp,
                "retryCount",
                retryCount,
                "\n",
            );

            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) =>
                setTimeout(res, delay - Math.random() * delay * jitter),
            );
        }
    }

    console.log(
        "\n\n\n\n\n\ngetFeesPerUser-Retry count exceeded",
        "address",
        address,
        "startTimestamp",
        startTimestamp,
        "endTimestamp",
        endTimestamp,
        "\n\n\n\n\n\n",
    );
};

const getTradeVolumePerUserWrapper = async (arg: {
    address: string;
    timestamp: number;
}): Promise<number> => {
    return await getTradeVolumePerUser(arg.address, arg.timestamp);
};

const getFeesPerUserWrapper = async (arg: {
    address: string;
    startTimestamp: number;
    endTimestamp: number;
}): Promise<number> => {
    return await getFeesPerUser(
        arg.address,
        arg.startTimestamp,
        arg.endTimestamp,
    );
};

const getTradeVolumeBatched = batch(
    { batchSize: 100 },
    getTradeVolumePerUserWrapper,
);

const getFeesBatched = batch({ batchSize: 100 }, getFeesPerUserWrapper);

/**
 * Calculates total trade volume for a list of addresses, given a timestamp snapshot
 *
 * @param addresses
 * @param timestamp
 * @returns
 */
export const getTradeVolume = async (
    addresses: string[],
    timestamp: number,
): Promise<number[]> => {
    const args: { address: string; timestamp: number }[] = [];
    for (const address of addresses) {
        args.push({ address: address, timestamp: timestamp });
    }
    const tradeVolume = await getTradeVolumeBatched(args);
    return tradeVolume;
};

/**
 * Calculates total fees paid by a list of addresses, given a timestamp snapshot
 *
 * @param addresses
 * @param timestamp
 * @returns
 */
export const getFees = async (
    addresses: string[],
    startTimestamp: number,
    endTimestamp: number,
): Promise<number[]> => {
    const args: {
        address: string;
        startTimestamp: number;
        endTimestamp: number;
    }[] = [];
    for (const address of addresses) {
        args.push({
            address: address,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
        });
    }
    const fees = await getFeesBatched(args);
    return fees;
};
