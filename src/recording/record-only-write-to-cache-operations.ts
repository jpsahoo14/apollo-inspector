import { ISetApolloOperations, IApolloOperation } from "../interfaces";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { cloneDeep } from "lodash";

export const recordOnlyWriteToCacheOperations = (
  client: ApolloClient<InMemoryCache>,
  setApolloOperations: ISetApolloOperations
): (() => void) => {
  const cache = client.cache;
  const originalFn = cache.write;

  cache.write = function override(...args: [IApolloOperation]) {
    setApolloOperations((data) => {
      data.push(cloneDeep(args[0]));
      return data;
    });
    const result = originalFn.apply(this, args);

    return result;
  };

  return () => {
    cache.write = originalFn;
  };
};
