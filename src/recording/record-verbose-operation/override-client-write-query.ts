import {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  DataProxy,
} from "@apollo/client";
import {} from "../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IVerboseOperationMap,
  ClientWriteQueryOperation,
  BaseOperation,
  getBaseOperationConstructorExtraParams,
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
        variables: variables as OperationVariables,
        ...getBaseOperationConstructorExtraParams({ rawData }),
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
