import { IApolloOperation } from "./apollo-inspector.interface";
import { IDebugOperation } from "./debug-operation";
import { QueryOperation } from "./query-operation";

export type IVerboseOperationMap = Map<
  number,
  IDebugOperation | QueryOperation
>;

export interface IApolloInspectorState {
  operations: IApolloOperation[];
  verboseOperationsMap: IVerboseOperationMap;
  allOperations: { [key: number]: IApolloOperation };
  mutationToMutationId: Map<Document, number>;
  operationIdToApolloOpId: Map<number, number>;
  queryInfoToOperationId: Map<unknown, IDebugOperation>;
  currentOperationId: number;
  operationIdCounter: number;
  enableDebug?: boolean;
}

export type ISetVerboseApolloOperations = (
  updateData: IVerboseOperationMap | ((state: IVerboseOperationMap) => void)
) => void;
