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
  CacheReadQueryOperation,
  getBaseOperationConstructorExtraParams,
  addRelatedOperations,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideCacheReadQuery = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const cache = apolloClient.cache;
  const originalReadQuery = cache.readQuery;

  cache.readQuery = function override<T, TVariables>(
    ...args: [Cache.ReadQueryOptions<T, TVariables>]
  ) {
    const options: DataProxy.Query<TVariables, T> = args[0];
    const { query, id, variables } = options;

    const nextOperationId = ++rawData.operationIdCounter;
    const previousOperationId = rawData.currentOperationId;
    const readQueryOp = new CacheReadQueryOperation({
      debuggerEnabled: rawData.enableDebug || false,
      errorPolicy: undefined,
      operationId: nextOperationId,
      query,
      variables: variables as OperationVariables,
      ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
    });

    rawData.currentOperationId = nextOperationId;
    const result = originalReadQuery.apply(this, args);
    rawData.currentOperationId = previousOperationId;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      readQueryOp.duration.operationExecutionEndTime = performance.now();
      readQueryOp.addResult(result);
      opMap.set(nextOperationId, readQueryOp);
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(previousOperationId);
      addRelatedOperations(operation, nextOperationId);
    });

    return result;
  };

  return () => {
    cache.readQuery = originalReadQuery;
  };
};
