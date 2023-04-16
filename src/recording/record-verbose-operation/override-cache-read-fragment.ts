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
} from "../../interfaces";

export const overrideCacheReadFragment = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
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

    if (rawData.currentOperationId === 0) {
      // Create new operation
      const nextOperationId = ++rawData.operationIdCounter;
      const readFragOp = new CacheReadFragmentOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query: fragment,
        variables: variables as OperationVariables,
        fragmentName: fragmentName || "unknown_fragment_name",
        ...getBaseOperationConstructorExtraParams({ rawData }),
      });

      // set current operationId to new operationId
      rawData.currentOperationId = nextOperationId;
      const result = originalReadFragment.apply(this, args);
      rawData.currentOperationId = 0;

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        readFragOp.duration.operationExecutionEndTime = performance.now();
        readFragOp.addResult(result);
        opMap.set(nextOperationId, readFragOp);
      });

      return result;
    }

    const result = originalReadFragment.apply(this, args);

    return result;
  };

  return () => {
    cache.readFragment = originalReadFragment;
  };
};
