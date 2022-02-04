import * as dotenv from "dotenv";
import * as yargs from "yargs";
import * as inquirer from "inquirer";


import {
    resetLocal
} from "../src/reset-local";
import {fetchRewardEpochsCount, fetchRewardMarketsCount, fetchRewardUsersCount} from "../src/strapi-helpers";
import {LOCAL_STRAPI_URL} from "../src/constants";

dotenv.config();

const args = yargs.options({
    // ADD THESE HERE IF HARD CODING
}).argv;

const confirmRisky = async (collection: string) => {
    const {confirm} = await inquirer.prompt([
        {
            type: "confirm",
            message: `This will delete all the records in a running local strapi instance of this collection: ${collection}. Are you sure you want to continue?`,
            name: "confirm",
            default: false,
        },
    ]);
    return confirm;
};

const resetLocalCollection = async () => {
    const rewardUserCount = await fetchRewardUsersCount(LOCAL_STRAPI_URL);
    const rewardMarketCount = await fetchRewardMarketsCount(LOCAL_STRAPI_URL);
    const rewardEpochCount = await fetchRewardEpochsCount(LOCAL_STRAPI_URL);

    const {collectionToDelete} = await inquirer.prompt([{
            name: "collectionToDelete",
            type: "list",
            message: "Which collections would you like to delete from?",
            choices: [
                {name: `Reward Users - ${rewardUserCount} records`, value: 'Reward Users'},
                {name: `Reward Markets - ${rewardMarketCount} records`, value: 'Reward Markets'},
                {name: `Reward Epochs - ${rewardEpochCount} records`, value: 'Reward Epochs'},
            ],
        }]
    );
    console.log('Answer:', collectionToDelete);
    const confirm = await confirmRisky(collectionToDelete);
    if (confirm) {
        await resetLocal(collectionToDelete);
    }
}

(async (args: any) => {

    let repeat = true;
    while (repeat) {
        /* eslint-disable no-await-in-loop */
        await resetLocalCollection();
        const { startOver } = await inquirer.prompt([
            {
                type: "confirm",
                message: `Would you like to start over?`,
                name: "startOver",
                default: false,
            },
        ]);
        if (startOver) {
            console.clear();
        } else {
            repeat = false;
        }
    }
})(args)
