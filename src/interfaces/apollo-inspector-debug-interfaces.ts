import { IApolloOperation } from "./apollo-inspector.interface";
import { BaseOperation } from "./base-operation";
import { QueryOperation } from "./query-operation";
import { Timer } from "timer-node";

export type IVerboseOperationMap = Map<number, BaseOperation | QueryOperation>;

export interface IApolloInspectorState {
  operations: IApolloOperation[];
  verboseOperationsMap: IVerboseOperationMap;
  allOperations: { [key: number]: IApolloOperation };
  mutationToMutationId: Map<Document, number>;
  operationIdToApolloOpId: Map<number, number>;
  queryInfoToOperationId: Map<unknown, BaseOperation>;
  currentOperationId: number;
  operationIdCounter: number;
  enableDebug?: boolean;
  timer: Timer;
}

export type ISetVerboseApolloOperations = (
  updateData: IVerboseOperationMap | ((state: IVerboseOperationMap) => void)
) => void;
