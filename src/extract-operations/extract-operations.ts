import {
  IApolloInspectorState,
  IDataView,
  IInspectorTrackingConfig,
  IVerboseOperation,
  OperationType,
} from "../interfaces";
import { extractCacheOperations } from "./extract-cache-operations";
import { extractAllOperationsData } from "./extract-all-operations";
import { extractVerboseOperationsData } from "./extract-verbose-operations";
import { extractAffectedQueriesData } from "./extract-affected-queries-data";

export const extractOperations = (
  rawData: IApolloInspectorState,
  config: IInspectorTrackingConfig
): IDataView => {
  const result: IDataView = {
    affectedQueriesOperations: null,
    allOperations: null,
    operations: null,
    verboseOperations: null,
  };

  result.allOperations = extractAllOperationsData(rawData.allOperations);
  result.verboseOperations = extractVerboseOperationsData(
    rawData.verboseOperationsMap,
    config
  );
  result.operations = result.verboseOperations.filter(
    (operation: IVerboseOperation) => {
      const operationType = operation.operationType;

      switch (operationType) {
        case OperationType.Query:
        case OperationType.Mutation:
        case OperationType.Subscription: {
          return true;
        }

        default: {
          if (operation.relatedOperations.parentOperationId !== 0) {
            return false;
          }
          return true;
        }
      }
    }
  );
  result.affectedQueriesOperations = extractAffectedQueriesData(
    rawData.verboseOperationsMap
  );
  return result;
};
