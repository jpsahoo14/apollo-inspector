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
  addRelatedOperations,
  CacheWriteFragmentOperation,
  IApolloClientObject,
} from "../../../interfaces";
import { getAffectedQueries } from "../../../apollo-inspector-utils";
import { DocumentNode } from "graphql";

export const overrideCacheWriteFragment = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
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

    // Create new operation
    const nextOperationId = ++rawData.operationIdCounter;
    const writeFragmentOp = getOperation<TData, TVariables>(
      rawData,
      nextOperationId,
      fragment,
      variables,
      fragmentName,
      clientObj
    );
    writeFragmentOp.addResult(data);

    // set current operationId to new operationId
    const previousOperationId = rawData.currentOperationId;
    rawData.currentOperationId = nextOperationId;
    const result = originalWriteFragment.apply(this, args);
    rawData.currentOperationId = previousOperationId;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      // add the operation to map
      writeFragmentOp.duration.operationExecutionEndTime = performance.now();
      opMap.set(nextOperationId, writeFragmentOp);
      return writeFragmentOp;
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(previousOperationId);
      addRelatedOperations(operation, nextOperationId);
      return operation;
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      if (rawData.currentOperationId !== 0) {
        const writeFragmentOp = opMap.get(rawData.currentOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeFragmentOp?.addAffectedQueries(affectedQueries);
        return writeFragmentOp;
      } else {
        const writeFragmentOp = opMap.get(nextOperationId);
        const affectedQueries = getAffectedQueries(apolloClient);
        writeFragmentOp?.addAffectedQueries(affectedQueries);
        return writeFragmentOp;
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
  fragmentName: string | undefined,
  clientObj: IApolloClientObject
) =>
  new CacheWriteFragmentOperation({
    debuggerEnabled: rawData.enableDebug || false,
    errorPolicy: undefined,
    operationId: nextOperationId,
    query: fragment,
    variables: variables as OperationVariables,
    fragmentName: fragmentName || "unknown_fragment_name",
    ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
  });
