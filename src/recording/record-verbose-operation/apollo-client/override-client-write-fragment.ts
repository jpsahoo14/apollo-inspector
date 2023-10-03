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
  ClientWriteFragmentOperation,
  getBaseOperationConstructorExtraParams,
  addRelatedOperations,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideClientWriteFragment = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
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
      const writeFragmentOp = new ClientWriteFragmentOperation({
        debuggerEnabled: rawData.enableDebug || false,
        errorPolicy: undefined,
        operationId: nextOperationId,
        query: fragment,
        variables: variables as OperationVariables,
        fragmentName: fragmentName || "",
        ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
      });
      writeFragmentOp.addResult(data);
      opMap.set(nextOperationId, writeFragmentOp);
      return writeFragmentOp;
    });

    const previousOperationId = rawData.currentOperationId;
    rawData.currentOperationId = nextOperationId;
    const result = originalWriteFragment.apply(this, args);
    rawData.currentOperationId = previousOperationId;

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation = opMap.get(previousOperationId);
      addRelatedOperations(operation, nextOperationId);
      return operation;
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const operation: ClientWriteFragmentOperation | undefined = opMap.get(
        nextOperationId
      ) as ClientWriteFragmentOperation | undefined;

      if (operation) {
        operation.duration.operationExecutionEndTime = performance.now();
      }
      return operation;
    });

    return result;
  };

  return () => {
    apolloClient.writeFragment = originalWriteFragment;
  };
};
