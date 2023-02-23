import {
  OperationDefinitionNode,
  DocumentNode,
  getOperationAST,
} from "graphql";
import {
  IInspectorTrackingConfig,
  IApolloInspectorState,
  IApolloClient,
} from "./interfaces";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

export const getOperationName = (query: DocumentNode) => {
  const definition =
    query && query.definitions && query.definitions.length > 0
      ? (query.definitions[0] as OperationDefinitionNode)
      : null;
  const operationName = definition ? definition.name?.value : "name_not_found";

  return operationName;
};

export function getOperationNameV2(doc: DocumentNode): string {
  const name = getOperationAST(doc);

  if (!name) {
    console.log(`no name for query ${doc}`);
  }

  return name?.name?.value || "Name_Not_Found";
}

export const copyToClipboard = async (obj: unknown) => {
  try {
    await window.navigator.clipboard.writeText(JSON.stringify(obj));
  } catch (error) {}
};

export const defaultConfig: IInspectorTrackingConfig = {
  tracking: { trackVerboseOperations: true },
  hooks: [],
};

export const resumeOperation = (
  rawData: IApolloInspectorState,
  currentOperationId: number,
  cb: () => void
) => {
  const oldCurrentOperationId = rawData.currentOperationId;
  if (currentOperationId != 0) {
    rawData.currentOperationId = currentOperationId;
  }
  const result = cb();
  rawData.currentOperationId = oldCurrentOperationId;
  return result;
};

export const getAffectedQueries = (
  client: ApolloClient<NormalizedCacheObject>
) => {
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
