import {
  ApolloClient,
  NormalizedCacheObject,
  Cache,
  OperationVariables,
  DataProxy,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IVerboseOperationMap,
  RestrictedTimer,
  CacheReadQueryOperation,
} from "../../interfaces";

export const overrideCacheReadQuery = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const cache = apolloClient.cache;
  const originalReadQuery = cache.readQuery;

  cache.readQuery = function override<T, TVariables>(
    ...args: [Cache.ReadQueryOptions<T, TVariables>]
  ) {
    const options: DataProxy.Query<TVariables, T> = args[0];
    const { query, id, variables } = options;

    if (rawData.currentOperationId === 0) {
      const nextOperationId = ++rawData.operationIdCounter;
      const readQueryOp = new CacheReadQueryOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query,
        timer: new RestrictedTimer(rawData.timer),
        variables: variables as OperationVariables,
      });

      rawData.currentOperationId = nextOperationId;
      const result = originalReadQuery.apply(this, args);
      rawData.currentOperationId = 0;

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        readQueryOp.duration.operationExecutionEndTime = performance.now();
        readQueryOp.addResult(result);
        opMap.set(nextOperationId, readQueryOp);
      });

      return result;
    }

    const result = originalReadQuery.apply(this, args);

    return result;
  };

  return () => {
    cache.readQuery = originalReadQuery;
  };
};
