import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IVerboseOperationMap,
  QueryOperation,
  IApolloClientObject,
} from "../../../interfaces";
import {
  FetchQueryByPolicyParams,
  getApolloQueryManager,
} from "../../../apollo-client-internals";

export const overrideFetchQueryByPolicy = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const map: { [key: string]: boolean } = {};

  const queryManager = getApolloQueryManager(apolloClient);
  const originalFetchQueryByPolicy = queryManager.fetchQueryByPolicy;

  queryManager.fetchQueryByPolicy = function override(
    ...args: FetchQueryByPolicyParams
  ) {
    const queryInfo = args[0];
    const options = args[1];
    const { variables, fetchPolicy } = options;

    const operationId = rawData.currentOperationId;
    rawData.enableDebug &&
      console.log(
        `APD operationId:${operationId} fetchQueryByPolicy queryId:${queryInfo.observableQuery?.queryId} fetchPolicy:${fetchPolicy}`
      );

    if (rawData.enableDebug && operationId !== 0 && map[operationId]) {
      debugger;
    }
    map[operationId] = true;

    const result = originalFetchQueryByPolicy.apply(this, args);
    const diff = queryInfo.getDiff(variables);

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const op = opMap.get(operationId) as QueryOperation | undefined;
      if (op) {
        if (rawData.enableDebug && op.fetchPolicy !== fetchPolicy) {
          debugger;
        }
        op.fetchPolicy = fetchPolicy;
        op.diff = diff;
      }
      return op;
    });
    return result;
  };

  return () => {
    queryManager.fetchQueryByPolicy = originalFetchQueryByPolicy;
  };
};
