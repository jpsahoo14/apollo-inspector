import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  IApolloClientCache,
  IVerboseOperationMap,
  QueryOperation,
} from "../../interfaces";

export const overrideCacheBroadcastWatches = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const cache = apolloClient.cache;
  const originalBroadcastWatches = (cache as unknown as IApolloClientCache)
    .broadcastWatches;

  (cache as unknown as IApolloClientCache).broadcastWatches = function override(
    ...args: unknown[]
  ) {
    const cacheBroadcastWatchStartTime = performance.now();
    const result = originalBroadcastWatches.apply(this, args);
    const cacheBroadcastWatchEndTime = performance.now();
    const operationId = rawData.currentOperationId;
    rawData.enableDebug &&
      console.log(
        `APD operationId:${operationId} overrideCacheBoradcastWatches`
      );

    if (operationId !== 0) {
      setVerboseApolloOperations((op: IVerboseOperationMap) => {
        const operation = op.get(operationId) as QueryOperation | undefined;

        if (operation && shouldAddTime(operation)) {
          operation.duration.cacheBroadcastWatchesStart =
            cacheBroadcastWatchStartTime;
          operation.duration.cacheBroadcastWatchesEnd =
            cacheBroadcastWatchEndTime;
        }
        operation?.setOperationStage(OperationStage.cacheBroadcastWatches);
      });
    }

    return result;
  };

  return () => {
    (cache as unknown as IApolloClientCache).broadcastWatches =
      originalBroadcastWatches;
  };
};

const shouldAddTime = (operation: QueryOperation | undefined) =>
  operation &&
  (operation.operationStage === OperationStage.markResultExecution ||
    operation.operationStage === OperationStage.addedDataToCache ||
    operation.operationStage === OperationStage.cacheDiff);
