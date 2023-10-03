import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  IVerboseOperationMap,
  IObservableQueryReportResult,
  QueryOperation,
  getBaseOperationConstructorExtraParams,
  IApolloClientObject,
} from "../../interfaces";

export const addAffectedWatchQueriesAsRelatedOperations = (
  clientObj: IApolloClientObject,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  operationId: number,
  cleanUps: (() => void)[]
) => {
  const watchQueries = (clientObj.client as unknown as IApolloClient)
    .queryManager.queries;

  for (const [_key, value] of watchQueries) {
    if (value.shouldNotify()) {
      const observableQuery = value.observableQuery;
      if (observableQuery) {
        const originalReportResult = observableQuery.reportResult;
        observableQuery.reportResult = function override(
          ...args: IObservableQueryReportResult
        ) {
          const [result, variables] = args;

          originalReportResult.apply(this, args);
          const nextOperationId = ++rawData.operationIdCounter;

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const operation = opMap.get(operationId);
            operation?.addRelatedOperation(nextOperationId);
            return operation;
          });

          setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
            const queryOp = new QueryOperation({
              queryInfo: value,
              variables,
              query: value.document,
              operationId: nextOperationId,
              fetchPolicy: "cache-only",
              debuggerEnabled: rawData.enableDebug || false,
              errorPolicy: undefined,
              ...getBaseOperationConstructorExtraParams({ rawData }, clientObj),
            });
            queryOp.addResult(result);
            opMap.set(nextOperationId, queryOp);
            return queryOp;
          });

          observableQuery.reportResult = originalReportResult;
        };

        cleanUps.push(() => {
          observableQuery.reportResult = originalReportResult;
        });
      }
    }
  }
};
