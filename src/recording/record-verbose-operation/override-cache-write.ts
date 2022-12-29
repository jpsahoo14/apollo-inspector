import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  IApolloClientCacheWriteParams,
  IVerboseOperationMap,
  QueryOperation,
} from "../../interfaces";

export const overrideCacheWrite = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawDataRef: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const cache = apolloClient.cache;
  const originalWrite = cache.write;

  cache.write = function override(...args: IApolloClientCacheWriteParams) {
    const cacheWriteStart = performance.now();
    const result = originalWrite.apply(this, args);
    const cacheWriteEnd = performance.now();
    const operationId = rawDataRef.currentOperationId;
    rawDataRef.enableDebug &&
      console.log(`APD operationId:${operationId} overrideCacheWrite`);
    if (operationId !== 0) {
      setVerboseApolloOperations((op: IVerboseOperationMap) => {
        const operation: QueryOperation | undefined = op.get(operationId) as
          | QueryOperation
          | undefined;

        if (
          operation &&
          operation.operationStage === OperationStage.markResultExecution
        ) {
          operation.duration.cacheWriteStart = cacheWriteStart;
          operation.duration.cacheWriteEnd = cacheWriteEnd;
        }
        operation?.setOperationStage(OperationStage.addedDataToCache);
      });
    }
    return result;
  };

  return () => {
    cache.write = originalWrite;
  };
};
