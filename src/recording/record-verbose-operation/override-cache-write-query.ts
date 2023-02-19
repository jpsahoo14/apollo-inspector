import {
  ApolloClient,
  NormalizedCacheObject,
  Cache,
  OperationVariables,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IVerboseOperationMap,
} from "../../interfaces";
import { getAffectedQueries } from "../../apollo-inspector-utils";

export const overrideCacheWriteQuery = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const cache = apolloClient.cache;
  const originalWriteQuery = cache.writeQuery;

  cache.writeQuery = function override<TData, TVariables = OperationVariables>(
    ...args: [Cache.WriteQueryOptions<TData, TVariables>]
  ) {
    const result = originalWriteQuery.apply(this, args);

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      if (rawData.currentOperationId !== 0) {
        const writeQueryOp = opMap.get(rawData.currentOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeQueryOp?.addAffectedQueries(affectedQueries);
      }
    });

    return result;
  };
};
