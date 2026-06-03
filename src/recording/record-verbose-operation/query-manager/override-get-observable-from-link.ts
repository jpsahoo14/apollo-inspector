import {
  Observable,
  Observer,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  QueryOperation,
  IVerboseOperationMap,
  IApolloClientObject,
} from "../../../interfaces";
import {
  GetObservableFromLinkArgs,
  getApolloQueryManager,
  getDocumentInfo,
  hasInFlightLinkObservable,
} from "../../../apollo-client-internals";

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
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const map: { [key: string]: boolean } = {};

  const queryManager = getApolloQueryManager(apolloClient);
  const originalGetObservableFromLink = queryManager.getObservableFromLink;

  queryManager.getObservableFromLink = function override(
    ...args: GetObservableFromLinkArgs
  ) {
    const [
      query,
      context,
      variables,
      extensionsOrDeduplication,
      deduplicationValue
    ] = args;

    const deduplication =
      (typeof deduplicationValue === "boolean"
        ? deduplicationValue
        : typeof extensionsOrDeduplication === "boolean"
        ? extensionsOrDeduplication
        : context?.queryDeduplication) ??
      this.queryDeduplication;

    const operationId = rawData.currentOperationId;
    debug(rawData, operationId, map);

    const { serverQuery, clientQuery } = getDocumentInfo(this, query);

    rawData.enableDebug &&
      console.log(
        `APD operationId:${operationId} getObservableFromLink serverQuery:${!!serverQuery} clientQuery:${!!clientQuery}`
      );

    const piggyBackOnExistingObservable = hasInFlightLinkObservable(
      this,
      serverQuery,
      variables
    );

    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const op = opMap.get(operationId) as QueryOperation | undefined;
      if (op) {
        op.serverQuery = serverQuery || undefined;
        op.clientQuery = clientQuery || undefined;
        op.deduplication = deduplication;
        op.piggyBackOnExistingObservable = piggyBackOnExistingObservable;
      }
      return op;
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
    queryManager.getObservableFromLink = originalGetObservableFromLink;
  };
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
