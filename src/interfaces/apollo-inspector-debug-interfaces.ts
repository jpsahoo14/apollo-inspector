import {
  IApolloOperation,
  IInspectorTrackingConfig,
} from "./apollo-inspector.interface";
import { BaseOperation } from "./operation-model/base-operation";
import { MutationOperation, QueryOperation } from "./operation-model";
import { Timer } from "timer-node";

export type IVerboseOperationMap = Map<
  number,
  BaseOperation | QueryOperation | MutationOperation
>;

export interface IApolloInspectorState {
  operations: IApolloOperation[];
  verboseOperationsMap: IVerboseOperationMap;
  allOperations: { [key: number]: IApolloOperation };
  mutationToMutationId: Map<Document, number>;
  operationIdToApolloOpId: Map<number, number>;
  queryInfoToOperationId: Map<unknown, BaseOperation>;
  currentOperationId: number;
  broadcastQueriesOperationId: number;
  operationIdCounter: number;
  enableDebug?: boolean;
  timer: Timer;
  config: IInspectorTrackingConfig;
}

export type ISetVerboseApolloOperations = (
  updateData: IVerboseOperationMap | ((state: IVerboseOperationMap) => void)
) => void;

export const NameNotFound = "Name_Not_Found";
