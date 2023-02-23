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

export const overrideCacheWriteFragment = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const cache = apolloClient.cache;
  const originalWriteFragment = cache.writeFragment;

  cache.writeFragment = function override<
    TData,
    TVariables = OperationVariables
  >(...args: [Cache.WriteFragmentOptions<TData, TVariables>]) {
    const result = originalWriteFragment.apply(this, args);

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      if (rawData.currentOperationId !== 0) {
        const writeFragmentOp = opMap.get(rawData.currentOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeFragmentOp?.addAffectedQueries(affectedQueries);
      }
    });

    return result;
  };

  return () => {
    cache.writeFragment = originalWriteFragment;
  };
};
