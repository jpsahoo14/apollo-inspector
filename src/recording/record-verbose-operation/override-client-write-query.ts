import {
  ApolloClient,
  NormalizedCacheObject,
  Cache,
  OperationVariables,
  DataProxy,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  IVerboseOperationMap,
  QueryOperation,
  SubscriptionOperation,
  DataId,
  WriteQueryOperation,
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
      const writeQueryOp = new WriteQueryOperation({
        dataId: DataId.WRITE_QUERY,
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query,
        timer: new RestrictedTimer(rawData.timer),
        variables,
      });
      writeQueryOp.addResult(data);

      opMap.set(nextOperationId, writeQueryOp);
    });

    rawData.currentOperationId = nextOperationId;
    const result = originalWriteQuery.apply(this, args);
    rawData.currentOperationId = 0;

    return result;
  };
};
