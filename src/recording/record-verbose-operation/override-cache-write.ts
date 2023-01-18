import { ApolloClient, NormalizedCacheObject, Cache } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  IVerboseOperationMap,
  QueryOperation,
  SubscriptionOperation,
  DataId,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces/restricted-timer";

export const overrideCacheWrite = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
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
        }
        operation?.setOperationStage(OperationStage.addedDataToCache);
      });
    } else if (args[0].dataId === "ROOT_SUBSCRIPTION") {
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const { query, result, variables } = args[0];
        const operationId = ++rawData.operationIdCounter;
        const operation = new SubscriptionOperation({
          dataId: DataId.ROOT_SUBSCRIPTION,
          query,
          variables,
          operationId,
          debuggerEnabled: rawData.enableDebug || false,
          errorPolicy: "none",
          timer: new RestrictedTimer(rawData.timer),
        });
        operation.addResult(result);
        operation.setOperationStage(OperationStage.addedDataToCache);
        opMap.set(operationId, operation);
      });
    }
    return result;
  };

  return () => {
    cache.write = originalWrite;
  };
};
