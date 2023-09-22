import {
  NormalizedCacheObject,
  ErrorPolicy,
  Observable,
  ApolloClient,
} from "@apollo/client";
import { getAffectedQueries } from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  IFetchQueryObservableParams,
  QueryOperation,
  IVerboseOperationMap,
  getBaseOperationConstructorExtraParams,
  IGetResultsFromLinkArgs,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideGetResultsFromLink = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const originalgetResultsFromLink = (apolloClient as unknown as IApolloClient)
    .queryManager.getResultsFromLink;
  const cleanUps: (() => void)[] = [];
  (apolloClient as unknown as IApolloClient).queryManager.getResultsFromLink =
    function override(...args: IGetResultsFromLinkArgs) {
      const operationId = rawData.currentOperationId;

      const observable = originalgetResultsFromLink.apply(this, args);

      const subscription = observable.subscribe({
        next: () => {
          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const operation = opMap.get(operationId);
            const affectedQueries = getAffectedQueries(apolloClient);
            operation?.addAffectedQueries(affectedQueries);
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
    (apolloClient as unknown as IApolloClient).queryManager.getResultsFromLink =
      originalgetResultsFromLink;
    cleanUps.forEach((cleanup) => cleanup());
  };
};
