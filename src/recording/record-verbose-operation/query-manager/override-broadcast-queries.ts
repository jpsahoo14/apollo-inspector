import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { getAffectedQueries } from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  QueryOperation,
  IMarkMutationResultArgs,
  IVerboseOperationMap,
  BaseOperation,
  DataId,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideBroadcastQueries = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const originalBroadcastQueries = (apolloClient as unknown as IApolloClient)
    .queryManager.broadcastQueries;

  (apolloClient as unknown as IApolloClient).queryManager.broadcastQueries =
    function override() {
      const currentOperationId = rawData.currentOperationId;

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const operation = opMap.get(currentOperationId);
        if (operation && shouldAddAffectedQueries(operation)) {
          const affectedQueries = getAffectedQueries(apolloClient);
          operation.addAffectedQueries(affectedQueries);
        }
        return operation;
      });
      if (rawData.broadcastQueriesOperationId) {
        rawData.currentOperationId = rawData.broadcastQueriesOperationId;
        rawData.broadcastQueriesOperationId = 0;
      }
      originalBroadcastQueries.apply(this);
      rawData.currentOperationId = currentOperationId;
    };

  return () => {
    (apolloClient as unknown as IApolloClient).queryManager.broadcastQueries =
      originalBroadcastQueries;
  };
};

const shouldAddAffectedQueries = (operation: BaseOperation): boolean => {
  if (
    operation.dataId === DataId.CLIENT_WRITE_FRAGMENT ||
    operation.dataId === DataId.CLIENT_WRITE_QUERY ||
    operation.dataId === DataId.CACHE_WRITE_QUERY ||
    operation.dataId === DataId.CACHE_WRITE_FRAGMENT
  ) {
    return true;
  }

  return false;
};
