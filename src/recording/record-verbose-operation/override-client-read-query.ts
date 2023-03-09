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
  ClientReadQueryOperation,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces";

export const overrideClientReadQuery = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const originalReadQuery = apolloClient.readQuery;

  apolloClient.readQuery = function override<
    T = any,
    TVariables = OperationVariables
  >(...args: [DataProxy.Query<TVariables, T>]) {
    const options = args[0];
    const { query, id, variables } = options;

    const nextOperationId = ++rawData.operationIdCounter;
    rawData.enableDebug &&
      console.log(
        `APD operationid:${nextOperationId} apolloClient.readQuery start`
      );

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const readQueryOp = new ClientReadQueryOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query,
        timer: new RestrictedTimer(rawData.timer),
        variables: variables as OperationVariables,
      });
      opMap.set(nextOperationId, readQueryOp);
    });

    rawData.currentOperationId = nextOperationId;
    const result = originalReadQuery.apply(this, args);
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
    apolloClient.readQuery = originalReadQuery;
  };
};
