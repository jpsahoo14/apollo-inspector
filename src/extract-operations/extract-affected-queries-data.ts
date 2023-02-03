/* eslint-disable msteams/no-eslint-disable */
/* eslint-disable msteams/no-abusive-eslint-disable */
import * as React from "react";
import {
  IApolloInspectorState,
  IDataView,
  IAffectedQueryMap,
  IDebugOperation,
  IAffectedQuery,
  IVerboseOperation,
  IVerboseOperationMap,
  IInspectorTrackingConfig,
} from "../interfaces";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { DocumentNode } from "graphql";

export const extractAffectedQueriesData = (
  operations: IVerboseOperationMap
) => {
  const affectedQueryToQueries: IAffectedQueryMap = {};

  operations.forEach((operation: IDebugOperation, key: number) => {
    const { query, affectedQueries } = operation;
    const queryName: string = getOperationNameV2(query) as string;

    affectedQueries.forEach((aq: DocumentNode) => {
      const aqName = getOperationNameV2(aq);
      let value = getMapValueOrDefault<IAffectedQuery>(
        affectedQueryToQueries,
        aqName,
        null
      );
      if (value) {
        value.dueToOperations = [...value.dueToOperations, queryName];
      } else {
        value = { affectedQueryName: aqName, dueToOperations: [queryName] };
      }
      affectedQueryToQueries[aqName] = value;
    });
  });

  return affectedQueryToQueries;
};

const getMapValueOrDefault = <T>(
  mapObj: IAffectedQueryMap,
  key: string,
  defaultValue: T | null = null
): T | null => {
  if (mapObj[key]) {
    return mapObj[key] as T;
  } else {
    return defaultValue;
  }
};
