import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  ICachedQueryInfo,
  IApolloInspectorState,
  OperationStage,
  IApolloClient,
  IQueryInfo,
  QueryOperation,
} from "../../interfaces";

export const overrideQueryInfoMarkResult = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  _setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const revertExistingQueries = overrideForExistingQueries(
    apolloClient,
    rawData
  );
  const revertNewQuerie = overrideForNewQueries(apolloClient, rawData);

  return () => {
    revertExistingQueries();
    revertNewQuerie();
  };
};

const overrideForExistingQueries = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState
) => {
  const existingWatchQueriesMap: Map<string, IQueryInfo> = (
    apolloClient as unknown as IApolloClient
  ).queryManager.queries;
  const cachedOriginalFns = new Map<string, ICachedQueryInfo>();

  for (const [key, value] of existingWatchQueriesMap) {
    const originalMarkResult = value.markResult;
    cachedOriginalFns.set(key, { queryInfo: value, originalMarkResult });

    value.markResult = function override(...args: unknown[]) {
      const data = args[0] as { operationId: number };
      const self = this;
      const debugOperation = rawData.queryInfoToOperationId.get(
        self
      ) as QueryOperation;
      if (
        rawData.enableDebug &&
        debugOperation &&
        data.operationId !== debugOperation.id
      ) {
        debugger;
      }
      rawData.currentOperationId = debugOperation?.id || 0;
      rawData.enableDebug &&
        console.log(`APD operationId:${rawData.currentOperationId} markResult`);

      debugOperation?.setOperationStage(OperationStage.markResultExecution);
      const result = originalMarkResult.apply(self, args);
      rawData.currentOperationId = 0;

      const affectedQueries = getAffectedQueries(apolloClient);
      debugOperation?.addAffectedQueries(affectedQueries);

      return result;
    };
  }

  return () => {
    for (const [_key, value] of cachedOriginalFns) {
      const { queryInfo, originalMarkResult } = value;
      queryInfo.markResult = originalMarkResult;
    }
  };
};

const overrideForNewQueries = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState
) => {
  const originalWatchQueriesMap = (apolloClient as unknown as IApolloClient)
    .queryManager.queries;
  const cachedOriginalFns = new Map<string, ICachedQueryInfo>();

  const handler = {
    set(target: Map<string, IQueryInfo>, key: string, value: object) {
      return Reflect.set(target, key, value);
    },
    get(target: Map<string, IQueryInfo>, key: string) {
      let ret = Reflect.get(target, key);
      if (typeof ret === "function") {
        ret = ret.bind(target);
      }

      if (key === "set") {
        const originalSetFn = ret;
        ret = (key: string, value: IQueryInfo) => {
          const orignalMarkResult = value.markResult;
          cachedOriginalFns.set(key, {
            queryInfo: value,
            originalMarkResult: orignalMarkResult,
          });
          value.markResult = function override(...arg: unknown[]) {
            const data = arg[0] as { operationId: number };
            const self = this;
            const debugOperation = rawData.queryInfoToOperationId.get(
              self
            ) as QueryOperation;

            if (
              rawData.enableDebug &&
              debugOperation &&
              data.operationId !== debugOperation.id
            ) {
              debugger;
            }

            rawData.enableDebug &&
              console.log(
                `APD operationId:${debugOperation?.id || 0} markResult`
              );
            rawData.currentOperationId = debugOperation?.id || 0;
            debugOperation?.setOperationStage(
              OperationStage.markResultExecution
            );
            const result = orignalMarkResult.apply(this, arg);
            rawData.currentOperationId = 0;

            const affectedQueries = getAffectedQueries(apolloClient);
            debugOperation?.addAffectedQueries(affectedQueries);

            return result;
          };
          originalSetFn.call(this, key, value);
        };
      }
      return ret;
    },
  };

  const proxy = new Proxy(originalWatchQueriesMap, handler);
  (apolloClient as unknown as IApolloClient).queryManager.queries = proxy;

  return () => {
    (apolloClient as unknown as IApolloClient).queryManager.queries =
      originalWatchQueriesMap;
    for (const [_key, value] of cachedOriginalFns) {
      const { queryInfo, originalMarkResult } = value;
      queryInfo.markResult = originalMarkResult;
    }
  };
};

const getAffectedQueries = (client: ApolloClient<NormalizedCacheObject>) => {
  const watchQueries = (client as unknown as IApolloClient).queryManager
    .queries;
  const affectedQueries = [];
  for (const [_key, value] of watchQueries) {
    if (value.dirty === true) {
      affectedQueries.push(value.document);
    }
  }

  return affectedQueries;
};
