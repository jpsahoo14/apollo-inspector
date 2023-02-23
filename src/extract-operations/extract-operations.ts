import {
  IApolloInspectorState,
  IDataView,
  IInspectorTrackingConfig,
} from "../interfaces";
import { extractCacheOperations } from "./extract-cache-operations";
import { extractAllOperationsData } from "./extract-all-operations";
import { extractVerboseOperationsData } from "./extract-verbose-operations";
import { extractAffectedQueriesData } from "./extract-affected-queries-data";

export const extractOperations = (
  rawData: IApolloInspectorState,
  config: IInspectorTrackingConfig
) => {
  console.log({ rawData });
  const result: IDataView = {
    affectedQueriesOperations: null,
    allOperations: null,
    operations: null,
    verboseOperations: null,
  };

  result.operations = extractCacheOperations(rawData.operations);
  result.allOperations = extractAllOperationsData(rawData.allOperations);
  result.verboseOperations = extractVerboseOperationsData(
    rawData.verboseOperationsMap,
    config
  );
  result.affectedQueriesOperations = extractAffectedQueriesData(
    rawData.verboseOperationsMap
  );

  return result;
};
