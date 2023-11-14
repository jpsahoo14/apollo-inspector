import {
  IVerboseOperation,
  OperationType,
  ITiming,
  OperationStatus,
} from "./apollo-inspector.interface";
import { DocumentNode } from "graphql";

export interface IBaseOperation {
  addError(error: unknown): void;
  setInActive(): void;
  addAffectedQueries(queries: DocumentNode[]): void;
  getOperationInfo(): Readonly<IVerboseOperation>;
  getTotalExecutionTime(): number;
  getOperationType(): OperationType;
  getCacheWriteTime(): number;
  addResult(result: unknown): void;
  addTimingInfo(key: keyof ITiming): void;
  setCacheSnapshot(cache: unknown): void;
  getOperationName(): string;
  addRelatedOperation(operationId: number): void;
  markDirty(): void;
}
