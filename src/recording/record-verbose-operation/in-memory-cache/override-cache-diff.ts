import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  ICacheDiffParams,
  IVerboseOperationMap,
  QueryOperation,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideCacheDiff = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const cache = apolloClient.cache;
  const originalCacheDiff = cache.diff;

  cache.diff = function override(...args: ICacheDiffParams) {
    const cacheDiffStartTime = performance.now();
    const result = originalCacheDiff.apply(this, args);
    const cacheDiffEndTime = performance.now();
    const operationId = rawData.currentOperationId;
    rawData.enableDebug &&
      console.log(`APD operationId:${operationId} overrideCacheDiff`);

    if (operationId !== 0) {
      setVerboseApolloOperations((op: IVerboseOperationMap) => {
        const operation = op.get(operationId) as QueryOperation | undefined;

        if (
          operation &&
          (operation.operationStage === OperationStage.markResultExecution ||
            operation.operationStage === OperationStage.addedDataToCache)
        ) {
          operation.duration.cacheDiffStart = cacheDiffStartTime;
          operation.duration.cacheDiffEnd = cacheDiffEndTime;
          operation?.setOperationStage(OperationStage.cacheDiff);
        }
        return operation;
      });
    }

    return result;
  };

  return () => {
    cache.diff = originalCacheDiff;
  };
};
