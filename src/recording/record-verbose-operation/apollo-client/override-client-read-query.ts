import {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  DataProxy,
} from "@apollo/client";
import {} from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IVerboseOperationMap,
  ClientReadQueryOperation,
  getBaseOperationConstructorExtraParams,
  addRelatedOperations,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideClientReadQuery = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const originalReadQuery = apolloClient.readQuery;

  apolloClient.readQuery = function override<
    T = any,
    TVariables = OperationVariables,
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
        variables: variables as OperationVariables,
        ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
      });
      opMap.set(nextOperationId, readQueryOp);
    });

    const previousOperationId = rawData.currentOperationId;
    rawData.currentOperationId = nextOperationId;
    const result = originalReadQuery.apply(this, args);
    rawData.currentOperationId = previousOperationId;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(previousOperationId);
      addRelatedOperations(operation, nextOperationId);
    });

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
