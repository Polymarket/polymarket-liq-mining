import fetch from "cross-fetch";
import {LOCAL_STRAPI_URL} from "./constants";

export async function resetLocal(collection: string): Promise<boolean> {
    const collectionMap = {
        "Reward Users": "users",
        "Reward Epochs": "epoches",
        "Reward Markets": "markets"
    }
    const endpointSuffix = collectionMap[collection];
    // clear reward-users collection
    // login using http://localhost:1337/admin/login
    const url = `${LOCAL_STRAPI_URL}/admin/login`;
    const strapiEmail = process.env.STRAPI_ADMIN_EMAIL;
    const strapiPassword = process.env.STRAPI_ADMIN_PASSWORD;

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

        const {data: {token}} = loginJson;
        const recordResponse = await fetch(`${LOCAL_STRAPI_URL}/reward-${endpointSuffix}?_limit=-1`);

        console.log({recordResponse});

        const recordsJson = await recordResponse.json();

        console.log({recordsJson});
        console.log(`${collection} length`, recordsJson.length);

        // delete one to validate connection and token permissions
        const firstOne = recordsJson.pop();

        console.log("Deleting one record as a test of permissions...")

        await fetch(`${LOCAL_STRAPI_URL}/reward-${endpointSuffix}/${firstOne.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("Success! Moving onto other records...");

        let batch = [];
        const originalLength = recordsJson.length;
        let batchIndex = 0;
        const batchSize = 100;
        while (recordsJson.length > 0) {
            batch = recordsJson.splice(0, Math.min(batchSize, recordsJson.length));
            await Promise.all(batch.map(async (each, index) => {

                console.log(`Deleting ${batchIndex * batchSize + index + 1} of ${originalLength} ${collection} records`);

                await fetch(`${LOCAL_STRAPI_URL}/reward-users/${each.id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
            }))
            batchIndex++;
        }

        console.log(`Deleted all ${originalLength} ${collection} records`);
        return true;
    } catch (e) {
        console.error({...e})
        return false;
    }
}

