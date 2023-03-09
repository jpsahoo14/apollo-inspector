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
  ClientReadFragmentOperation,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces";

export const overrideClientReadFragment = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const originalReadFragment = apolloClient.readFragment;

  apolloClient.readFragment = function override<
    T = any,
    TVariables = OperationVariables
  >(...args: [DataProxy.Fragment<TVariables, T>]) {
    const options = args[0];
    const { fragment, fragmentName, id, variables } = options;

    const nextOperationId = ++rawData.operationIdCounter;
    rawData.enableDebug &&
      console.log(
        `APD operationid:${nextOperationId} apolloClient.readFragment start`
      );

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const readFragOp = new ClientReadFragmentOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        fragmentName: fragmentName || "unknown_fragment_name",
        operationId: nextOperationId,
        query: fragment,
        timer: new RestrictedTimer(rawData.timer),
        variables: variables as OperationVariables,
      });

      opMap.set(nextOperationId, readFragOp);
    });

    rawData.currentOperationId = nextOperationId;
    const result = originalReadFragment.apply(this, args);
    rawData.currentOperationId = 0;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(nextOperationId);

      if (operation) {
        operation.addResult(result);
        operation.duration.operationExecutionEndTime = performance.now();
      }
    });

    return result;
  };

  return () => {
    apolloClient.readFragment = originalReadFragment;
  };
};
