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
  getBaseOperationConstructorExtraParams,
  addRelatedOperations,
  IApolloClientObject,
} from "../../../interfaces";
import { getAffectedQueries } from "../../../apollo-inspector-utils";
import { CacheWriteQueryOperation } from "../../../interfaces/";

export const overrideCacheWriteQuery = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const cache = apolloClient.cache;
  const originalWriteQuery = cache.writeQuery;

  cache.writeQuery = function override<TData, TVariables = OperationVariables>(
    ...args: [Cache.WriteQueryOptions<TData, TVariables>]
  ) {
    const { data, query, broadcast, id, overwrite, variables } = args[0];

    // Create new operation
    const nextOperationId = ++rawData.operationIdCounter;
    const operation = getOperation(
      rawData,
      nextOperationId,
      query,
      variables,
      clientObj
    );
    operation.addResult(data);

    // set current operationId to new operationId
    const previousOperationId = rawData.currentOperationId;
    rawData.currentOperationId = nextOperationId;
    const result = originalWriteQuery.apply(this, args);
    rawData.currentOperationId = previousOperationId;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      // add the operation to map
      operation.duration.operationExecutionEndTime = performance.now();
      opMap.set(nextOperationId, operation);
      return operation;
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(previousOperationId);
      addRelatedOperations(operation, nextOperationId);
      return operation;
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      if (rawData.currentOperationId !== 0) {
        const writeQueryOp = opMap.get(rawData.currentOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeQueryOp?.addAffectedQueries(affectedQueries);
        return writeQueryOp;
      } else {
        const writeQueryOp = opMap.get(nextOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeQueryOp?.addAffectedQueries(affectedQueries);
        return writeQueryOp;
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
  variables: any,
  clientObj: IApolloClientObject
) =>
  new CacheWriteQueryOperation({
    debuggerEnabled: rawData.enableDebug || false,
    errorPolicy: undefined,
    operationId: nextOperationId,
    query,
    variables: variables as OperationVariables,
    ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
  });
