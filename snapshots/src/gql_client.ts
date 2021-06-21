import { ApolloClient, createHttpLink, DefaultOptions, InMemoryCache, DocumentNode, NormalizedCacheObject } from "@apollo/client/core";
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


//Declare global Apollo client to be initialized *after* environment variables are configured
let client: ApolloClient<NormalizedCacheObject>;


async function getOrInitializeClient(): Promise<ApolloClient<NormalizedCacheObject>> {
  if(client == null){
    client = new ApolloClient({
        link: createHttpLink({
          uri: process.env.SUBGRAPH_URL,
          fetch,
        }),
        cache: new InMemoryCache(),
        defaultOptions,
      });
  }
  return client;
}

export const queryGqlClient = async (queryString: DocumentNode, variables: any): Promise<any> => {
  const gqlClient = await getOrInitializeClient();
  return await gqlClient.query({
    query: queryString,
    variables: variables
  });
}