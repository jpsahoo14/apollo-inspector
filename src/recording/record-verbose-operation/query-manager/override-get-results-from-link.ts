import { getAffectedQueries } from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  QueryOperation,
  IVerboseOperationMap,
  IApolloClientObject,
} from "../../../interfaces";
import {
  getApolloQueryManager,
  GetResultsFromLinkArgs,
} from "../../../apollo-client-internals";

export const overrideGetResultsFromLink = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const queryManager = getApolloQueryManager(apolloClient);
  const originalGetResultsFromLink = queryManager.getResultsFromLink;
  const cleanUps: (() => void)[] = [];

  queryManager.getResultsFromLink = function override(
    ...args: GetResultsFromLinkArgs
  ) {
    const operationId = rawData.currentOperationId;
    const observable = originalGetResultsFromLink.apply(this, args);

    const subscription = observable.subscribe({
      next: () => {
        setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
          const operation = opMap.get(operationId) as QueryOperation | undefined;
          const affectedQueries = getAffectedQueries(apolloClient);
          operation?.addAffectedQueries(affectedQueries);
          return operation;
        });
      },
      error: () => {
        subscription.unsubscribe();
      },
      complete: () => {
        subscription.unsubscribe();
      },
    });

    cleanUps.push(() => subscription.unsubscribe());

    return observable;
  };

  return () => {
    queryManager.getResultsFromLink = originalGetResultsFromLink;
    cleanUps.forEach((cleanup) => cleanup());
  };
};
