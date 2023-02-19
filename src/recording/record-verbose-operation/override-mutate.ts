import {
  ApolloClient,
  NormalizedCacheObject,
  MutationOptions,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  DataId,
  IApolloInspectorState,
  IVerboseOperationMap,
  MutationOperation,
  MutationFetchPolicy,
  IApolloClient,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces/restricted-timer";

export const overrideMutate = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const originalMutate = apolloClient.mutate;
  const queryManager = (apolloClient as unknown as IApolloClient).queryManager;
  apolloClient.mutate = async function override(...args: unknown[]) {
    const operationId = ++rawData.operationIdCounter;
    const options = args[0] as MutationOptions;
    const {
      mutation,
      variables,
      optimisticResponse,
      updateQueries,
      refetchQueries = [],
      awaitRefetchQueries = false,
      update: updateWithProxyFn,
      errorPolicy = "none",
      fetchPolicy,
      // context = {},
    } = options;
    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const mutateOperation = new MutationOperation({
        dataId: DataId.ROOT_MUTATION,
        variables,
        query: mutation,
        operationId,
        fetchPolicy:
          fetchPolicy ||
          queryManager.defaultOptions.mutate?.fetchPolicy ||
          ("network-only" as MutationFetchPolicy),
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy,
        timer: new RestrictedTimer(rawData.timer),
        optimisticResponse,
        updateQueries,
        refetchQueries,
        awaitRefetchQueries,
      });
      opMap.set(operationId, mutateOperation);
    });

    try {
      rawData.currentOperationId = operationId;
      const resultPromise = originalMutate.apply(this, args);
      rawData.currentOperationId = 0;
      const result = await resultPromise;

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId) as MutationOperation;
        op && op.addResult(result);
        op && (op.duration.operationExecutionEndTime = performance.now());
      });
      return result;
    } catch (error) {
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId) as MutationOperation;
        op && op.addError(error);
        op && (op.duration.operationExecutionEndTime = performance.now());
      });

      throw error;
    }
  };

  return () => {
    apolloClient.mutate = originalMutate;
  };
};
