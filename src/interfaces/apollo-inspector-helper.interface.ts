import {
  IApolloInspectorState,
  IVerboseOperationMap,
} from "./apollo-inspector-debug-interfaces";
import { IApolloOperation, IAllOperations } from "./apollo-inspector.interface";
import { Timer } from "timer-node";
import { BaseOperation } from "./operation-model/base-operation";

export interface IDataSetters {
  getRawData: () => IApolloInspectorState;
  setCacheOperations: ISetCacheOperations;
  setAllOperations: ISetAllOperations;
  setVerboseOperations: ISetVerboseOperations;
  getTimerInstance: () => Timer;
}

export type ISetCacheOperations = (
  updateData: IApolloOperation[] | ((state: IApolloOperation[]) => void)
) => void;

export type ISetAllOperations = (
  updateData: IAllOperations | ((state: IAllOperations) => void)
) => void;

export type ISetVerboseOperations = (
  updateData:
    | IVerboseOperationMap
    | ((state: IVerboseOperationMap) => BaseOperation | null | undefined)
) => void;
