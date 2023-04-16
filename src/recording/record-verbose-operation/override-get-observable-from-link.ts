import {
  ApolloClient,
  DocumentNode,
  NormalizedCacheObject,
  Observable,
  OperationVariables,
  Observer,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  IQueryManager,
  QueryOperation,
  IVerboseOperationMap,
  IGetObservableFromLinkArgs,
} from "../../interfaces";

interface IError {
  operationId: number;
  extensions?: IExtensions;
}

interface IResult {
  operationId: number;
  extensions?: IExtensions;
  errors: unknown;
}

export interface IExtensions {
  perfStats: {
    requestReceivedTime: number;
    responseSendTime: number;
    workerResponseTime: number;
  };
}

export const overrideGetObservableFromLink = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const map: { [key: string]: boolean } = {};

  const originalGetObservableFromLink = (
    apolloClient as unknown as IApolloClient
  ).queryManager.getObservableFromLink;

  (
    apolloClient as unknown as IApolloClient
  ).queryManager.getObservableFromLink = function override(
    ...args: IGetObservableFromLinkArgs
  ) {
    const [query, context, variables, deduplicationValue] = args;

    const deduplication =
      (deduplicationValue || context?.queryDeduplication) ??
      this.queryDeduplication;

    const operationId = rawData.currentOperationId;
    debug(rawData, operationId, map);

    const {
      serverQuery,
      clientQuery,
    }: {
      serverQuery: DocumentNode | undefined;
      clientQuery: DocumentNode | undefined;
    } = this.transform(query);

    rawData.enableDebug &&
      console.log(
        `APD operationId:${operationId} getObservableFromLink serverQuery:${!!serverQuery} clientQuery:${!!clientQuery}`
      );

    const piggyBackOnExistingObservable = hasPiggyBackOnExistingObservable({
      queryManager: this,
      serverQuery,
      variables,
    });

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const op = opMap.get(operationId) as QueryOperation | undefined;
      if (op) {
        op.serverQuery = serverQuery;
        op.clientQuery = clientQuery;
        op.deduplication = deduplication;
        op.piggyBackOnExistingObservable = piggyBackOnExistingObservable;
      }
    });
    const result: Observable<unknown> = originalGetObservableFromLink.apply(
      this,
      args
    );

    const obs = new Observable((observer: Observer<unknown>) => {
      rawData.enableDebug &&
        console.log(
          `APD operationId:${operationId} getObservableFromLinkSubscription start`
        );

      const handlers = {
        next: (result: IResult) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${operationId} getObservableFromLinkSubscription next`
            );

          result.operationId = operationId;
          observer.next?.(result);
        },
        error: (error: IError) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${operationId} getObservableFromLinkSubscription error`
            );
          error.operationId = operationId;

          observer.error?.(error);
        },
        complete: () => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${operationId} getObservableFromLinkSubscription complete`
            );
          observer.complete?.();
          subscription.unsubscribe();
        },
      };
      const subscription = result.subscribe(handlers);
      return () => subscription.unsubscribe();
    });
    return obs;
  };

  return () => {
    (
      apolloClient as unknown as IApolloClient
    ).queryManager.getObservableFromLink = originalGetObservableFromLink;
  };
};

interface IPiggyBackOnExistingObservable {
  queryManager: IQueryManager;
  serverQuery: DocumentNode | undefined;
  variables: OperationVariables;
}

const hasPiggyBackOnExistingObservable = ({
  queryManager,
  serverQuery,
  variables,
}: IPiggyBackOnExistingObservable): boolean => {
  if (serverQuery) {
    const byVariables = queryManager.inFlightLinkObservables.get(serverQuery);
    if (byVariables) {
      const varJson = JSON.stringify(variables);
      const observable = byVariables.get(varJson);
      if (observable) {
        return true;
      }
    }
  }

  return false;
};
function debug(
  rawDataRef: IApolloInspectorState,
  operationId: number,
  map: { [key: string]: boolean }
) {
  if (rawDataRef.enableDebug && operationId !== 0 && map[operationId]) {
    debugger;
  }
  map[operationId] = true;
}
