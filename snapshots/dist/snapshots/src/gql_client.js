"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryGqlClient = void 0;
const core_1 = require("@apollo/client/core");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const defaultOptions = {
    watchQuery: {
        fetchPolicy: "no-cache",
        errorPolicy: "ignore",
    },
    query: {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
    },
};
//Declare global Apollo client to be initialized *after* environment variables are configured
let client;
async function getOrInitializeClient() {
    if (client == null) {
        client = new core_1.ApolloClient({
            link: core_1.createHttpLink({
                uri: process.env.SUBGRAPH_URL,
                fetch: cross_fetch_1.default,
            }),
            cache: new core_1.InMemoryCache(),
            defaultOptions,
        });
    }
    return client;
}
const queryGqlClient = async (queryString, variables) => {
    const gqlClient = await getOrInitializeClient();
    return await gqlClient.query({
        query: queryString,
        variables: variables
    });
};
exports.queryGqlClient = queryGqlClient;
