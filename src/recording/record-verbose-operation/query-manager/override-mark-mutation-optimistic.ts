import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  IVerboseOperationMap,
  IMarkMutationOptimisticArgs,
  MutationOperation,
  IApolloClientObject,
} from "../../../interfaces";
import { getAffectedQueries } from "../../../apollo-inspector-utils";
import { addAffectedWatchQueriesAsRelatedOperations } from "../record-verbose-operations-utils";

export const overrideMarkMutationOptimistic = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const originalMarkMutationOptimistic = (
    apolloClient as unknown as IApolloClient
  ).queryManager.markMutationOptimistic;

  const cleanUps: (() => void)[] = [];

  (
    apolloClient as unknown as IApolloClient
  ).queryManager.markMutationOptimistic = async function override(
    ...args: IMarkMutationOptimisticArgs
  ) {
    const [optimisticResponse, mutation] = args;
    const operationId = rawData.currentOperationId;

    originalMarkMutationOptimistic.apply(this, [
      optimisticResponse,
      { ...mutation, operationId },
    ]);

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(operationId) as MutationOperation;
      if (operation) {
        const affectedQueries = getAffectedQueries(apolloClient);
        operation.addAffectedQueriesDueToOptimisticResponse(affectedQueries);
        affectedQueries.length &&
          addAffectedWatchQueriesAsRelatedOperations(
            clientObj,
            rawData,
            setVerboseApolloOperations,
            operationId,
            cleanUps
          );
      }
      return operation;
    });
  };

  return () => {
    (
      apolloClient as unknown as IApolloClient
    ).queryManager.markMutationOptimistic = originalMarkMutationOptimistic;
    cleanUps.forEach((cleanUp) => cleanUp());
  };
};
