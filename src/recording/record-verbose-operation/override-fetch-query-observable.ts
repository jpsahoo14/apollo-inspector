import {
  ApolloClient,
  NormalizedCacheObject,
  ErrorPolicy,
  Observable,
} from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  DataId,
  IApolloInspectorState,
  IApolloClient,
  IFetchQueryObservableParams,
  QueryOperation,
  IVerboseOperationMap,
} from "../../interfaces";
import { RestrictedTimer } from "../../interfaces/restricted-timer";

export const overrideFetchQueryObservable = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
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

      const nextId = ++rawData.operationIdCounter;
      rawData.enableDebug &&
        console.log(
          `APD operationId:${nextId} fetchQueryObservable start queryId:${queryId}`
        );
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const queryOp = new QueryOperation({
          dataId: DataId.ROOT_QUERY,
          queryInfo,
          variables: options.variables,
          query: options.query,
          operationId: nextId,
          fetchPolicy,
          debuggerEnabled: rawData.enableDebug || false,
          errorPolicy,
          timer: new RestrictedTimer(rawData.timer),
        });
        opMap.set(nextId, queryOp);
        if (
          rawData.enableDebug &&
          rawData.queryInfoToOperationId.get(queryInfo)
        ) {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${
                rawData.queryInfoToOperationId.get(queryInfo)?.id
              } currentOperationId:${nextId} queryId:${queryId} `
            );
          debugger;
        }
        rawData.queryInfoToOperationId.set(queryInfo, queryOp);
      });
      rawData.currentOperationId = nextId;
      const observable = originalFetchQueryObservable.apply(this, args);
      rawData.currentOperationId = 0;

      const subscription = observable.subscribe({
        next: (result: unknown) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextId} fetchQueryObservable next`,
              result
            );

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextId) as QueryOperation | undefined;
            op?.addResult(result);
          });
        },
        error: (error: unknown) => {
          rawData.enableDebug &&
            console.log(`APD operationId:${nextId} fetchQueryObservable error`);

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextId);
            op?.addError(error);
          });
          subscription.unsubscribe();
        },
        complete: () => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextId} fetchQueryObservable complete`
            );

          subscription && subscription.unsubscribe();
          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextId);
            op?.setInActive();
          });
        },
      });

      (observable.promise as Promise<unknown>)
        .then((result: unknown) => {
          rawData.enableDebug &&
            console.log(
              `APD operationId:${nextId} fetchQueryObservable then`,
              result
            );

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextId);
            op && (op.duration.operationExecutionEndTime = performance.now());
          });
        })
        .catch(() => {
          rawData.enableDebug &&
            console.log(`APD operationId:${nextId} fetchQueryObservable catch`);

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const op = opMap.get(nextId);
            op && (op.duration.operationExecutionEndTime = performance.now());
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
