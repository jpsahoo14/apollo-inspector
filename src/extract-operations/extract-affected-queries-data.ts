import {
  IAffectedQueryMap,
  BaseOperation,
  IAffectedQueryInternalMap,
  IVerboseOperationMap,
  IAffectedQueryInternal,
  IAffectedQuery,
} from "../interfaces";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { DocumentNode } from "graphql";

export const extractAffectedQueriesData = (
  operations: IVerboseOperationMap
): IAffectedQueryMap => {
  const affectedQueryToQueries: IAffectedQueryInternalMap = {};

  operations.forEach((operation: BaseOperation, key: number) => {
    const { query, affectedQueries } = operation;
    const queryName: string = getOperationNameV2(query) as string;

    affectedQueries.forEach((aq: DocumentNode) => {
      const aqName = getOperationNameV2(aq);
      let value = getMapValueOrDefault<IAffectedQueryInternal>(
        affectedQueryToQueries,
        aqName,
        null
      );
      if (value) {
        value.dueToOperationsMap[operation.id] = {
          id: operation.id,
          operationType: operation.getOperationType(),
          operationName: operation.getOperationName(),
        };
      } else {
        value = {
          affectedQueryName: aqName,
          dueToOperationsMap: {
            [operation.id]: {
              id: operation.id,
              operationType: operation.getOperationType(),
              operationName: operation.getOperationName(),
            },
          },
        };
      }
      affectedQueryToQueries[aqName] = value;
    });
  });

  return getAffectedQueryMap(affectedQueryToQueries);
};

const getAffectedQueryMap = (
  affectedQueryToQueries: IAffectedQueryInternalMap
): IAffectedQueryMap => {
  const result: IAffectedQueryMap = {};
  for (const key in affectedQueryToQueries) {
    const value = affectedQueryToQueries[key];
    const dueToOperations = [];
    for (const dueToOperationsKey in value.dueToOperationsMap) {
      const dueToOperation = value.dueToOperationsMap[dueToOperationsKey];
      dueToOperations.push(dueToOperation);
    }
    const newValue: IAffectedQuery = { ...value, dueToOperations };
    result[newValue.affectedQueryName] = newValue;
  }
  return result;
};

const getMapValueOrDefault = <T>(
  mapObj: IAffectedQueryInternalMap,
  key: string,
  defaultValue: T | null = null
): T | null => {
  if (mapObj[key]) {
    return mapObj[key] as T;
  } else {
    return defaultValue;
  }
};
