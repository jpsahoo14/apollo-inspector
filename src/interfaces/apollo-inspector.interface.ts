import { DocumentNode } from "graphql";
import {
  FetchPolicy,
  WatchQueryFetchPolicy,
  OperationVariables,
} from "@apollo/client";
import { IQueryInfo } from "./apollo-client.interface";

export enum DebugState {
  Initial,
  StartedRecording,
  StoppedRecording,
}

export interface IApolloOperation {
  dataId: DataId | string;
  result?: unknown;
  query: DocumentNode;
  variables: OperationVariables | undefined;
  isActive: boolean;
  error?: unknown;
  duration?: number;
  fetchPolicy?: FetchPolicy;
}

export enum OperationStage {
  fetchQueryObservable = "fetchQueryObservable",
  linkExecutionStart = "linkExecutionStart",
  linkNextExecution = "linkNextExecution",
  markResultExecution = "markResultExecution",
  addedDataToCache = "addedDataToCache",
  cacheDiff = "cacheDiff",
  cacheBroadcastWatches = "cacheBroadcastWatches",
  linkCompleteExecution = "linkCompleteExecution",
  mutate = "mutate",
}

export enum ResultsFrom {
  CACHE = "CACHE",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

export interface IDebugOperationDuration {
  linkEnterTime?: DOMHighResTimeStamp;
  linkExecutionStartTime?: DOMHighResTimeStamp;
  linkNextExecutionTime: DOMHighResTimeStamp[];
  linkErrorExecutionTime?: DOMHighResTimeStamp;
  linkCompleteExecutionTime?: DOMHighResTimeStamp;
  operationExecutionStartTime?: DOMHighResTimeStamp;
  operationExecutionEndTime?: DOMHighResTimeStamp;
  cacheWriteStart?: DOMHighResTimeStamp;
  cacheWriteEnd?: DOMHighResTimeStamp;
  cacheDiffStart?: DOMHighResTimeStamp;
  cacheDiffEnd?: DOMHighResTimeStamp;
  cacheBroadcastWatchesStart?: DOMHighResTimeStamp;
  cacheBroadcastWatchesEnd?: DOMHighResTimeStamp;
  totalExecutionTime?: DOMHighResTimeStamp;
  totalResovlerTime?: DOMHighResTimeStamp;
  totalCacheWriteTime?: DOMHighResTimeStamp;
  totalCacheDiffTime?: DOMHighResTimeStamp;
  totalCacheBroadcastWatchesTime?: DOMHighResTimeStamp;
}

export interface IIPCTime {
  windowToWorkerRequestSendTime?: DOMHighResTimeStamp;
  windowToWorkerRequestReceviedTime?: DOMHighResTimeStamp;
  workerToWindowRequestSendTime?: DOMHighResTimeStamp;
  workerToWindowRequestReceiveTime?: DOMHighResTimeStamp;
  workerResponseTime?: DOMHighResTimeStamp;
}

export type ISetApolloOperations = (
  updateData: IApolloOperation[] | ((state: IApolloOperation[]) => void)
) => void;

export type ISetAllApolloOperations = (
  updateData: IAllOperations | ((state: IAllOperations) => void)
) => void;

export type ISetRecordingOption = (
  update: IRecordOperation | ((state: IRecordOperation) => IRecordOperation)
) => void;

export interface ICachedQueryInfo {
  queryInfo: IQueryInfo;
  originalMarkResult: () => void;
}

export type IRecordOperation = {
  [key in RecordOperationType]: boolean;
};

export interface IAllOperations {
  [key: number]: IApolloOperation;
}

export enum OperationType {
  Query = "Query",
  Mutation = "Mutation",
  Subscription = "Subscription",
  Fragment = "Fragment",
  Unknown = "Unknown",
}

export enum DataId {
  ROOT_QUERY = "ROOT_QUERY",
  ROOT_MUTATION = "ROOT_MUTATION",
  ROOT_OPTIMISTIC_MUTATION = "ROOT_OPTIMISTIC_MUTATION",
  ROOT_SUBSCRIPTION = "ROOT_SUBSCRIPTION",
}

export interface IMutation {
  mutationId: string;
  result: unknown;
  document: DocumentNode;
  variables?: Record<string, unknown>;
}

export interface IOperation {
  operationType: OperationType;
  operationName: string | undefined;
  operationString: string;
  variables: OperationVariables | undefined;
  result: unknown;
  error?: unknown;
  isActive?: boolean;
}

export interface IVerboseOperation {
  id: number;
  operationType: OperationType;
  operationName: string | undefined;
  operationString: string;
  variables: OperationVariables | undefined;
  error: unknown;
  warning: unknown[] | undefined;
  result: IOperationResult[];
  isOptimistic?: boolean;
  affectedQueries: DocumentNode[];
  isActive?: boolean;
  duration?: IVerboseOperationDuration | undefined;
  fetchPolicy: WatchQueryFetchPolicy | undefined;
}

export interface IVerboseOperationDuration {
  totalTime: DOMHighResTimeStamp | string;
  requestExecutionTime: DOMHighResTimeStamp | string;
  cacheWriteTime: DOMHighResTimeStamp | string;
  cacheDiffTime: DOMHighResTimeStamp | string;
  cacheBroadcastWatchesTime: DOMHighResTimeStamp | string;
}
export interface IOperationResult {
  from: ResultsFrom;
  result: unknown;
}

export const Not_Available = "Not Available";

export interface IDataView {
  operations: IOperation[] | null;
  verboseOperations: IVerboseOperation[] | null;
  allOperations: IOperation[] | null;
  affectedQueriesOperations: IAffectedQueryMap | null;
}

export enum RecordOperationType {
  AllOperations = "AllOperations",
  OnlyOperationsWhichWritesToCache = "OnlyOperationsWhichWritesToCache",
}

export enum TabHeaders {
  AllOperationsView,
  OperationsView,
  VerboseOperationView,
  AffectedQueriesView,
}

export const ProdApolloClientId = "CurrentApolloClient";

export interface IAffectedQueryMap {
  [key: string]: IAffectedQuery;
}

export interface IAffectedQuery {
  affectedQueryName: string;
  dueToOperations: string[];
}

export interface IInspectorTrackingConfig {
  trackCacheOperation?: boolean;
  trackVerboseOperations?: boolean;
  trackAllOperations?: boolean;
}

export type IStopTracking = () => IDataView;
