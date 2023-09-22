import { ApolloClient, NormalizedCacheObject, Cache } from "@apollo/client";
import {
  getAffectedQueries,
  setCacheInOperation,
} from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  IVerboseOperationMap,
  QueryOperation,
  SubscriptionOperation,
  getBaseOperationConstructorExtraParams,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideCacheWrite = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const cache = apolloClient.cache;
  const originalWrite = cache.write;

  cache.write = function override(...args: [Cache.WriteOptions]) {
    const cacheWriteStart = performance.now();
    const result = originalWrite.apply(this, args);
    const cacheWriteEnd = performance.now();
    const operationId = rawData.currentOperationId;
    rawData.enableDebug &&
      console.log(`APD operationId:${operationId} overrideCacheWrite`);
    if (operationId !== 0) {
      addCacheTimeInformationToOperation(
        setVerboseApolloOperations,
        operationId,
        cacheWriteStart,
        cacheWriteEnd,
        clientObj,
        rawData
      );
    } else if (args[0].dataId === "ROOT_SUBSCRIPTION") {
      addCacheTimeInformationToSubscriptionOperation(
        setVerboseApolloOperations,
        args,
        rawData,
        clientObj
      );
    }
    return result;
  };

  return () => {
    cache.write = originalWrite;
  };
};

const addCacheTimeInformationToSubscriptionOperation = (
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  args: [Cache.WriteOptions<any, any>],
  rawData: IApolloInspectorState,
  clientObj: IApolloClientObject
) => {
  setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
    const { query, result, variables } = args[0];
    const operationId = ++rawData.operationIdCounter;
    const operation = new SubscriptionOperation({
      query,
      variables,
      operationId,
      debuggerEnabled: rawData.enableDebug || false,
      errorPolicy: "none",
      ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
    });
    operation.addResult(result);
    operation.setOperationStage(OperationStage.addedDataToCache);
    operation.addTimingInfo("dataWrittenToCacheCompletedAt");
    setCacheInOperation(operation, clientObj.client);
    const affectedQueries = getAffectedQueries(clientObj.client);
    operation.addAffectedQueries(affectedQueries);
    opMap.set(operationId, operation);
  });
};

const addCacheTimeInformationToOperation = (
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  operationId: number,
  cacheWriteStart: number,
  cacheWriteEnd: number,
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState
) => {
  setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
    const operation: QueryOperation | undefined = opMap.get(operationId) as
      | QueryOperation
      | undefined;

    if (
      operation &&
      operation.operationStage === OperationStage.markResultExecution
    ) {
      operation.duration.cacheWriteStart = cacheWriteStart;
      operation.duration.cacheWriteEnd = cacheWriteEnd;
      operation.addTimingInfo("dataWrittenToCacheCompletedAt");
    }

    if (operation) {
      setCacheInOperation(operation, clientObj.client);
    }
    operation?.setOperationStage(OperationStage.addedDataToCache);
  });
};
