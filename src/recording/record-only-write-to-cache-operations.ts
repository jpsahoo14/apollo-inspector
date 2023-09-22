import {
  ISetApolloOperations,
  IApolloOperation,
  IApolloClientObject,
} from "../interfaces";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { cloneDeep } from "lodash-es";

export const recordOnlyWriteToCacheOperations = (
  clientObj: IApolloClientObject,
  setApolloOperations: ISetApolloOperations
): (() => void) => {
  const cache = clientObj.client.cache;
  const originalFn = cache.write;

  cache.write = function override(...args) {
    setApolloOperations((data) => {
      data.push(cloneDeep(args[0] as IApolloOperation));
      return data;
    });
    const result = originalFn.apply(this, args);

    return result;
  };

  return () => {
    cache.write = originalFn;
  };
};
