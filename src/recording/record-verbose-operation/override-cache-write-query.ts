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
  RestrictedTimer,
} from "../../interfaces";
import { getAffectedQueries } from "../../apollo-inspector-utils";
import { CacheWriteQueryOperation } from "../../interfaces/cache-write-query-operation";

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
    const { data, query, broadcast, id, overwrite, variables } = args[0];

    if (rawData.currentOperationId === 0) {
      // Create new operation
      const nextOperationId = ++rawData.operationIdCounter;
      const operation = getOperation(
        rawData,
        nextOperationId,
        query,
        variables
      );
      operation.addResult(data);

      // set current operationId to new operationId
      rawData.currentOperationId = nextOperationId;
      const result = originalWriteQuery.apply(this, args);
      rawData.currentOperationId = 0;

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        // add the operation to map
        operation.duration.operationExecutionEndTime = performance.now();
        opMap.set(nextOperationId, operation);
      });
      return result;
    }

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

  return () => {
    cache.writeQuery = originalWriteQuery;
  };
};

const getOperation = (
  rawData: IApolloInspectorState,
  nextOperationId: number,
  query: any,
  variables: any
) =>
  new CacheWriteQueryOperation({
    debuggerEnabled: rawData.enableDebug || false,
    errorPolicy: undefined,
    operationId: nextOperationId,
    query,
    timer: new RestrictedTimer(rawData.timer),
    variables: variables as OperationVariables,
  });
