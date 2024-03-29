import {
  ApolloClient,
  NormalizedCacheObject,
  ErrorPolicy,
  Observable,
} from "@apollo/client";
import {} from "../../../apollo-inspector-utils";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  IFetchQueryObservableParams,
  QueryOperation,
  IVerboseOperationMap,
  getBaseOperationConstructorExtraParams,
  IApolloClientObject,
} from "../../../interfaces";

export const overrideFetchQueryObservable = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const apolloClient = clientObj.client;
  const originalFetchQueryObservable = (
    apolloClient as unknown as IApolloClient
  ).queryManager.fetchQueryObservable;

  (apolloClient as unknown as IApolloClient).queryManager.fetchQueryObservable =
    function override(...args: IFetchQueryObservableParams) {
      const queryId: number = args[0] as number;
      const options = args[1];
      const { errorPolicy = "none" as ErrorPolicy } = options;

      const fetchPolicy = options.fetchPolicy || "cache-first";
      const queryInfo = (
        apolloClient as unknown as IApolloClient
      ).queryManager.getQuery(queryId);

      const nextOperationId = ++rawData.operationIdCounter;
      rawData.enableDebug &&
        console.log(
          `APD operationId:${nextOperationId} fetchQueryObservable start queryId:${queryId}`
        );
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const queryOp = new QueryOperation({
          queryInfo,
          variables: options.variables,
          query: options.query,
          operationId: nextOperationId,
          fetchPolicy,
          debuggerEnabled: rawData.enableDebug || false,
          errorPolicy,
          ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
        });
        opMap.set(nextOperationId, queryOp);
        if (
          rawData.enableDebug &&
          rawData.queryInfoToOperationId.get(queryInfo)
        ) {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${
                rawData.queryInfoToOperationId.get(queryInfo)?.id
              } currentOperationId:${nextOperationId} queryId:${queryId} `
            );
          debugger;
        }
        if (
          rawData.queryInfoToOperationId.has(queryInfo) &&
          rawData.enableDebug
        ) {
          debugger;
        }
        rawData.queryInfoToOperationId.set(queryInfo, queryOp);
        return queryOp;
      });

      const previousOperationId = rawData.currentOperationId;
      rawData.currentOperationId = nextOperationId;
      const observable = originalFetchQueryObservable.apply(this, args);
      rawData.currentOperationId = previousOperationId;

      const subscription = observable.subscribe({
        next: (result: {
          data: unknown;
          errors?: unknown;
          error?: unknown;
        }) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextOperationId} fetchQueryObservable next`,
              result
            );

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextOperationId) as QueryOperation | undefined;
            op?.addResult(result.data);
            op?.addError(result.errors || result.error);
            rawData.broadcastQueriesOperationId = nextOperationId;
            return op;
          });
        },
        error: (error: unknown) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextOperationId} fetchQueryObservable error`
            );

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextOperationId);
            op?.addError(error);
            return op;
          });
          subscription.unsubscribe();
        },
        complete: () => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextOperationId} fetchQueryObservable complete`
            );

          subscription && subscription.unsubscribe();
          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextOperationId);
            op?.setInActive();
            return op;
          });
        },
      });

      (observable.promise as Promise<unknown>)
        .then((result: unknown) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextOperationId} fetchQueryObservable then`,
              result
            );

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextOperationId);
            op && (op.duration.operationExecutionEndTime = performance.now());
            return op;
          });
        })
        .catch(() => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextOperationId} fetchQueryObservable catch`
            );

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextOperationId);
            op && (op.duration.operationExecutionEndTime = performance.now());
            return op;
          });
        });
      return observable as unknown as Observable<unknown>;
    };

  return () => {
    (
      apolloClient as unknown as IApolloClient
    ).queryManager.fetchQueryObservable = originalFetchQueryObservable;
  };
};
