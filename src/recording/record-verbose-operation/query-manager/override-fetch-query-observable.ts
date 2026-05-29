import { ErrorPolicy } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  QueryOperation,
  IVerboseOperationMap,
  getBaseOperationConstructorExtraParams,
  IApolloClientObject,
} from "../../../interfaces";
import {
  ApolloQueryInfoWithInternals,
  FetchConcastWithInfoParams,
  FetchConcastWithInfoResult,
  FetchQueryObservableOptions,
  FetchQueryObservableParams,
  getApolloQueryManager,
  getQueryInfo,
  ObservableSubscriptionLike,
  ObservableWithPromise,
} from "../../../apollo-client-internals";

export const overrideFetchQueryObservable = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
) => {
  const apolloClient = clientObj.client;
  const queryManager = getApolloQueryManager(apolloClient);
  const trackedSubscriptions: ObservableSubscriptionLike[] = [];

  if (typeof queryManager.fetchQueryObservable === "function") {
    const originalFetchQueryObservable = queryManager.fetchQueryObservable;

    queryManager.fetchQueryObservable = function override(
      ...args: FetchQueryObservableParams
    ) {
      const queryId = args[0];
      const options = args[1];
      const queryInfo = getQueryInfo(queryManager, queryId);
      const nextOperationId = recordQueryOperation({
        clientObj,
        rawData,
        setVerboseApolloOperations,
        queryInfo,
        options,
        query: options.query,
        queryId,
      });

      const previousOperationId = rawData.currentOperationId;
      rawData.currentOperationId = nextOperationId;
      const observable = originalFetchQueryObservable.apply(this, args);
      rawData.currentOperationId = previousOperationId;

      trackObservableResult({
        observable: observable as ObservableWithPromise,
        operationId: nextOperationId,
        rawData,
        setVerboseApolloOperations,
        trackedSubscriptions,
      });

      return observable;
    };

    return () => {
      queryManager.fetchQueryObservable = originalFetchQueryObservable;
      trackedSubscriptions.forEach((subscription) =>
        subscription.unsubscribe(),
      );
    };
  }

  if (typeof queryManager.fetchConcastWithInfo === "function") {
    const originalFetchConcastWithInfo = queryManager.fetchConcastWithInfo;

    queryManager.fetchConcastWithInfo = function override(
      ...args: FetchConcastWithInfoParams
    ): FetchConcastWithInfoResult {
      const [queryInfo, options, _networkStatus, query] = args;
      const nextOperationId = recordQueryOperation({
        clientObj,
        rawData,
        setVerboseApolloOperations,
        queryInfo,
        options,
        query: query || options.query,
        queryId: queryInfo.queryId,
      });

      const previousOperationId = rawData.currentOperationId;
      rawData.currentOperationId = nextOperationId;
      const result = originalFetchConcastWithInfo.apply(this, args);
      rawData.currentOperationId = previousOperationId;

      trackObservableResult({
        observable: result.concast,
        operationId: nextOperationId,
        rawData,
        setVerboseApolloOperations,
        trackedSubscriptions,
      });

      return result;
    };

    return () => {
      queryManager.fetchConcastWithInfo = originalFetchConcastWithInfo;
      trackedSubscriptions.forEach((subscription) =>
        subscription.unsubscribe(),
      );
    };
  }

  return () => {};
};

const recordQueryOperation = ({
  clientObj,
  rawData,
  setVerboseApolloOperations,
  queryInfo,
  options,
  query,
  queryId,
}: {
  clientObj: IApolloClientObject;
  rawData: IApolloInspectorState;
  setVerboseApolloOperations: ISetVerboseApolloOperations;
  queryInfo: ApolloQueryInfoWithInternals;
  options: FetchQueryObservableOptions;
  query: FetchQueryObservableOptions["query"];
  queryId: unknown;
}) => {
  const { errorPolicy = "none" as ErrorPolicy } = options;
  const fetchPolicy = options.fetchPolicy || "cache-first";
  const nextOperationId = ++rawData.operationIdCounter;

  rawData.enableDebug &&
    console.log(
      `APD operationId:${nextOperationId} fetchQuery start queryId:${queryId}`,
    );

  setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
    const queryOp = new QueryOperation({
      queryInfo,
      variables: options.variables,
      query,
      operationId: nextOperationId,
      fetchPolicy,
      debuggerEnabled: rawData.enableDebug || false,
      errorPolicy,
      ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
    });
    opMap.set(nextOperationId, queryOp);
    if (rawData.enableDebug && rawData.queryInfoToOperationId.get(queryInfo)) {
      rawData.enableDebug &&
        console.log(
          `APD operationId:${
            rawData.queryInfoToOperationId.get(queryInfo)?.id
          } currentOperationId:${nextOperationId} queryId:${queryId} `,
        );
      debugger;
    }
    if (rawData.queryInfoToOperationId.has(queryInfo) && rawData.enableDebug) {
      debugger;
    }
    rawData.queryInfoToOperationId.set(queryInfo, queryOp);
    return queryOp;
  });

  return nextOperationId;
};

const trackObservableResult = ({
  observable,
  operationId,
  rawData,
  setVerboseApolloOperations,
  trackedSubscriptions,
}: {
  observable: ObservableWithPromise;
  operationId: number;
  rawData: IApolloInspectorState;
  setVerboseApolloOperations: ISetVerboseApolloOperations;
  trackedSubscriptions: ObservableSubscriptionLike[];
}) => {
  let subscription: ObservableSubscriptionLike | undefined;

  const unsubscribe = () => {
    subscription?.unsubscribe();
    if (subscription) {
      const index = trackedSubscriptions.indexOf(subscription);
      if (index >= 0) {
        trackedSubscriptions.splice(index, 1);
      }
    }
  };

  subscription = observable.subscribe({
    next: (result: { data: unknown; errors?: unknown; error?: unknown }) => {
      rawData.enableDebug &&
        console.log(`APD operationId:${operationId} fetchQuery next`, result);

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId) as QueryOperation | undefined;
        op?.addResult(result.data);
        op?.addError(result.errors || result.error);
        rawData.broadcastQueriesOperationId = operationId;
        return op;
      });
    },
    error: (error: unknown) => {
      rawData.enableDebug &&
        console.log(`APD operationId:${operationId} fetchQuery error`);

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId);
        op?.addError(error);
        return op;
      });
      unsubscribe();
    },
    complete: () => {
      rawData.enableDebug &&
        console.log(`APD operationId:${operationId} fetchQuery complete`);

      unsubscribe();
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId);
        op?.setInActive();
        return op;
      });
    },
  });
  trackedSubscriptions.push(subscription);

  observable.promise
    ?.then((result: unknown) => {
      rawData.enableDebug &&
        console.log(`APD operationId:${operationId} fetchQuery then`, result);

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId);
        op && (op.duration.operationExecutionEndTime = performance.now());
        return op;
      });
    })
    .catch(() => {
      rawData.enableDebug &&
        console.log(`APD operationId:${operationId} fetchQuery catch`);

      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId);
        op && (op.duration.operationExecutionEndTime = performance.now());
        return op;
      });
    });
};
