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
  ClientWriteQueryOperation,
  BaseOperation,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces";

export const overrideClientWriteQuery = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const originalWriteQuery = apolloClient.writeQuery;

  apolloClient.writeQuery = function override<
    TData,
    TVariables = OperationVariables
  >(...args: [DataProxy.WriteQueryOptions<TData, TVariables>]) {
    const options = args[0];
    const { data, query, broadcast, id, overwrite, variables } = options;

    const nextOperationId = ++rawData.operationIdCounter;
    rawData.enableDebug &&
      console.log(
        `APD operationid:${nextOperationId} apolloClient.writeQuery start`
      );

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const writeQueryOp = new ClientWriteQueryOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query,
        timer: new RestrictedTimer(rawData.timer),
        variables: variables as OperationVariables,
      });
      writeQueryOp.addResult(data);

      opMap.set(nextOperationId, writeQueryOp);
    });

    rawData.currentOperationId = nextOperationId;
    const result = originalWriteQuery.apply(this, args);
    rawData.currentOperationId = 0;

    updateOperationEndExecutionTime(
      setVerboseApolloOperations,
      nextOperationId
    );
    return result;
  };

  return () => {
    apolloClient.writeQuery = originalWriteQuery;
  };
};
const updateOperationEndExecutionTime = (
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  nextOperationId: number
) => {
  setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
    const operation: BaseOperation | undefined = opMap.get(nextOperationId) as
      | BaseOperation
      | undefined;

    if (operation) {
      operation.duration.operationExecutionEndTime = performance.now();
    }
  });
};
