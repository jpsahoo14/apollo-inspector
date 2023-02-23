import {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  DataProxy,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IVerboseOperationMap,
  WriteFragmentOperation,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces";

export const overrideClientWriteFragment = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const originalWriteFragment = apolloClient.writeFragment;

  apolloClient.writeFragment = function override<
    TData,
    TVariables = OperationVariables
  >(...args: [DataProxy.WriteFragmentOptions<TData, TVariables>]) {
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

    const nextOperationId = ++rawData.operationIdCounter;
    rawData.enableDebug &&
      console.log(
        `APD operationid:${nextOperationId} apolloClient.writeFragment start`
      );

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const writeFragmentOp = new WriteFragmentOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query: fragment,
        timer: new RestrictedTimer(rawData.timer),
        variables: variables as OperationVariables,
        fragmentName: fragmentName || "",
      });
      writeFragmentOp.addResult(data);
      opMap.set(nextOperationId, writeFragmentOp);
    });

    rawData.currentOperationId = nextOperationId;
    const result = originalWriteFragment.apply(this, args);
    rawData.currentOperationId = 0;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation: WriteFragmentOperation | undefined = opMap.get(
        nextOperationId
      ) as WriteFragmentOperation | undefined;

      if (operation) {
        operation.duration.operationExecutionEndTime = performance.now();
      }
    });

    return result;
  };

  return () => {
    apolloClient.writeFragment = originalWriteFragment;
  };
};
