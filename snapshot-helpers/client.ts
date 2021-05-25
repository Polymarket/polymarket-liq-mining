import { ApolloClient, createHttpLink, DefaultOptions, InMemoryCache } from "@apollo/client";
import fetch from "cross-fetch";
import { SUBGRAPH_URL } from "./config"

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
    errorPolicy: "ignore",
  },
  query: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
};

const client = new ApolloClient({
  link: createHttpLink({
    uri: SUBGRAPH_URL,
    fetch,
  }),
  cache: new InMemoryCache(),
  defaultOptions,
});

export default client;
