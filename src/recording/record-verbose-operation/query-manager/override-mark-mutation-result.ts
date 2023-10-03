import { InMemoryCache } from "@apollo/client";
import { getAffectedQueries } from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  IMarkMutationResultArgs,
  IVerboseOperationMap,
  MutationOperation,
  IMutationResult,
  IApolloClientObject,
} from "../../../interfaces";
import { addAffectedWatchQueriesAsRelatedOperations } from "../record-verbose-operations-utils";

export const overrideMarkMutationResult = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const originalMarkMutationResult = (apolloClient as unknown as IApolloClient)
    .queryManager.markMutationResult;

  const cleanUps: (() => void)[] = [];

  (apolloClient as unknown as IApolloClient).queryManager.markMutationResult =
    function override(...args: IMarkMutationResultArgs) {
      const [mutation, cache] = args;

      const { result } = mutation;
      const newResult = result as { operationId: number };
      // mutation.operationId is present in case this function is being called in opstimistic phase
      const operationId = mutation.operationId || newResult.operationId;

      const promise = handleOperationExecutionInNonOptimisticPhase({
        originalMarkMutationResult,
        that: this,
        args,
        setVerboseApolloOperations,
        operationId,
        clientObj,
        rawData,
        cleanUps,
      });

      rawData.broadcastQueriesOperationId = operationId;

      return promise;
    };

  return () => {
    (apolloClient as unknown as IApolloClient).queryManager.markMutationResult =
      originalMarkMutationResult;
    cleanUps.forEach((cleanUp) => cleanUp());
  };
};

const isOperationRunningInOptimisticPhase = (
  operationId: number,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  let isRunningInOptimisticPhase = false;

  setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
    const operation = opMap.get(operationId) as MutationOperation;
    isRunningInOptimisticPhase = operation.isRunningOptimisticPhase;
    return operation;
  });

  return isRunningInOptimisticPhase;
};

interface IHandleOperationExecutionInNonOptimisticPhase {
  originalMarkMutationResult: (
    args_0: IMutationResult,
    args_1: InMemoryCache
  ) => unknown;
  that: any;
  args: any[];
  setVerboseApolloOperations: ISetVerboseApolloOperations;
  operationId: number;
  clientObj: IApolloClientObject;
  rawData: IApolloInspectorState;
  cleanUps: (() => void)[];
}
const handleOperationExecutionInNonOptimisticPhase = async ({
  originalMarkMutationResult,
  that,
  args,
  setVerboseApolloOperations,
  operationId,
  clientObj,
  rawData,
  cleanUps,
}: IHandleOperationExecutionInNonOptimisticPhase) => {
  const promise = await originalMarkMutationResult.apply(that, args);

  setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
    const operation = opMap.get(operationId) as MutationOperation;
    if (operation && !operation.isRunningOptimisticPhase) {
      const affectedQueries = getAffectedQueries(clientObj.client);
      operation.addAffectedQueries(affectedQueries);
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
  return promise;
};
