import { IApolloInspectorState, IDataView } from "../interfaces";
import { extractCacheOperations } from "./extract-cache-operations";
import { extractAllOperationsData } from "./extract-all-operations";
import { extractVerboseOperationsData } from "./extract-verbose-operations";

export const extractOperations = (rawData: IApolloInspectorState) => {
  const result: IDataView = {
    affectedQueriesOperations: null,
    allOperations: null,
    operations: null,
    verboseOperations: null,
  };

  result.operations = extractCacheOperations(rawData.operations);
  result.allOperations = extractAllOperationsData(rawData.allOperations);
  result.verboseOperations = extractVerboseOperationsData(
    rawData.verboseOperationsMap
  );

  return result;
};
