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
  CacheReadFragmentOperation,
  getBaseOperationConstructorExtraParams,
  addRelatedOperations,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideCacheReadFragment = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const cache = apolloClient.cache;
  const originalReadFragment = cache.readFragment;

  cache.readFragment = function override<FragmentType, TVariables = any>(
    ...args: [Cache.ReadFragmentOptions<FragmentType, TVariables>]
  ) {
    const options = args[0];
    const {
      fragment,
      canonizeResults,
      fragmentName,
      id,
      optimistic,
      returnPartialData,
      variables,
    } = options;

    // Create new operation
    const nextOperationId = ++rawData.operationIdCounter;
    const previousOperationId = rawData.currentOperationId;
    const readFragOp = new CacheReadFragmentOperation({
      debuggerEnabled: rawData.enableDebug || false,
      errorPolicy: undefined,
      operationId: nextOperationId,
      query: fragment,
      variables: variables as OperationVariables,
      fragmentName: fragmentName || "unknown_fragment_name",
      ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
    });

    // set current operationId to new operationId
    rawData.currentOperationId = nextOperationId;
    const result = originalReadFragment.apply(this, args);
    rawData.currentOperationId = previousOperationId;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      readFragOp.duration.operationExecutionEndTime = performance.now();
      readFragOp.addResult(result);
      opMap.set(nextOperationId, readFragOp);
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(previousOperationId);
      addRelatedOperations(operation, nextOperationId);
    });

    return result;
  };

  return () => {
    cache.readFragment = originalReadFragment;
  };
};
