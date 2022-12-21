import { IApolloInspectorState, IDataView } from "../interfaces";
import { extractCacheOperations } from "./extract-cache-operations";

export const extractOperations = (rawData: IApolloInspectorState) => {
  const result: IDataView = {
    affectedQueriesOperations: null,
    allOperations: null,
    operations: null,
    verboseOperations: null,
  };

  result.operations = extractCacheOperations(rawData.operations);

  return result;
};
