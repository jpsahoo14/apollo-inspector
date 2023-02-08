import { ApolloClient, InMemoryCache } from "@apollo/client";

export const createClient = () => {
  const cache = new InMemoryCache();
  const client = new ApolloClient({ cache });

  return client;
};
