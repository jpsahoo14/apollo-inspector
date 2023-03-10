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
  getBaseOperationConstructorExtraParams,
} from "../../interfaces";
import { getAffectedQueries } from "../../apollo-inspector-utils";
import { CacheWriteFragmentOperation } from "../../interfaces/";
import { RestrictedTimer } from "../../interfaces";
import { DocumentNode } from "graphql";

export const overrideCacheWriteFragment = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const cache = apolloClient.cache;
  const originalWriteFragment = cache.writeFragment;

  cache.writeFragment = function override<
    TData,
    TVariables = OperationVariables
  >(...args: [Cache.WriteFragmentOptions<TData, TVariables>]) {
    const options = args[0];
    const {
      data,
      fragment,
      broadcast,
      id,
      overwrite,
      variables,
      fragmentName,
    } = options;

    if (rawData.currentOperationId === 0) {
      // Create new operation
      const nextOperationId = ++rawData.operationIdCounter;
      const writeFragmentOp = getOperation<TData, TVariables>(
        rawData,
        nextOperationId,
        fragment,
        variables,
        fragmentName
      );
      writeFragmentOp.addResult(data);

      // set current operationId to new operationId
      rawData.currentOperationId = nextOperationId;
      const result = originalWriteFragment.apply(this, args);
      rawData.currentOperationId = 0;

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        // add the operation to map
        writeFragmentOp.duration.operationExecutionEndTime = performance.now();
        opMap.set(nextOperationId, writeFragmentOp);
      });

      return result;
    }

    const result = originalWriteFragment.apply(this, args);

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      if (rawData.currentOperationId !== 0) {
        const writeFragmentOp = opMap.get(rawData.currentOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeFragmentOp?.addAffectedQueries(affectedQueries);
      }
    });

    return result;
  };

  return () => {
    cache.writeFragment = originalWriteFragment;
  };
};
const getOperation = <TData, TVariables>(
  rawData: IApolloInspectorState,
  nextOperationId: number,
  fragment: DocumentNode,
  variables: TVariables | undefined,
  fragmentName: string | undefined
) =>
  new CacheWriteFragmentOperation({
    debuggerEnabled: rawData.enableDebug || false,
    errorPolicy: undefined,
    operationId: nextOperationId,
    query: fragment,
    variables: variables as OperationVariables,
    fragmentName: fragmentName || "unknown_fragment_name",
    ...getBaseOperationConstructorExtraParams({ rawData }),
  });
