import { ApolloClient, createHttpLink, DefaultOptions, InMemoryCache } from "@apollo/client";
import fetch from "cross-fetch";

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
    uri: process.env.SUBGRAPH_URL,
    fetch,
  }),
  cache: new InMemoryCache(),
  defaultOptions,
});

export default client;
