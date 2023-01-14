import { OperationDefinitionNode, DocumentNode } from "graphql";
import { ApolloClient } from "@apollo/client";
import { IInspectorTrackingConfig } from "./interfaces";

export const getOperationName = (query: DocumentNode) => {
  const definition =
    query && query.definitions && query.definitions.length > 0
      ? (query.definitions[0] as OperationDefinitionNode)
      : null;
  const operationName = definition ? definition.name?.value : "name_not_found";

  return operationName;
};

export function getOperationNameV2(doc: DocumentNode): string {
  const name =
    doc.definitions
      .filter(
        (definition) =>
          definition.kind === "OperationDefinition" && definition.name
      )
      .map((x: OperationDefinitionNode) => x?.name?.value)[0] ||
    "name_not_found_v2";

  if (!name) {
    console.log(`no name for query ${doc}`);
  }

  return name;
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
