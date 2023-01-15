import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

export const createClient = () => {
  const cache = new NormalizedCacheObject();
  const client = new ApolloClient({ cache });

  return client;
};
