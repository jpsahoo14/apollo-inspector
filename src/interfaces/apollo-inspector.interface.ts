import { DocumentNode } from "graphql";
import {
  FetchPolicy,
  WatchQueryFetchPolicy,
  OperationVariables,
  ApolloLink,
  ApolloClient,
  NormalizedCacheObject,
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
  startGraphQLSubscription = "startGraphQLSubscription",
  writeQuery = "writeQuery",
  writeFragment = "writeFragment",
}

export enum ResultsFrom {
  CACHE = "CACHE",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
  OPTIMISTIC_RESPONSE = "Optimistic_Response",
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

export interface ITiming {
  queuedAt: number;
  responseReceivedFromServerAt: number;
  dataWrittenToCacheCompletedAt: number;
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
  ClientWriteQuery = "ClientWriteQuery",
  ClientWriteFragment = "ClientWriteFragment",
  CacheWriteQuery = "CacheWriteQuery",
  CacheWriteFragment = "CacheWriteFragment",
  ClientReadQuery = "ClientReadQuery",
  ClientReadFragment = "ClientReadFragment",
  CacheReadQuery = "CacheReadQuery",
  CacheReadFragment = "CacheReadFragment",
  Unknown = "Unknown",
}

export enum DataId {
  ROOT_QUERY = "ROOT_QUERY",
  ROOT_MUTATION = "ROOT_MUTATION",
  ROOT_OPTIMISTIC_MUTATION = "ROOT_OPTIMISTIC_MUTATION",
  ROOT_SUBSCRIPTION = "ROOT_SUBSCRIPTION",
  CLIENT_WRITE_QUERY = "CLIENT_WRITE_QUERY",
  CLIENT_WRITE_FRAGMENT = "CLIENT_WRITE_FRAGMENT",
  CACHE_WRITE_QUERY = "CACHE_WRITE_QUERY",
  CACHE_WRITE_FRAGMENT = "CACHE_WRITE_FRAGMENT",
  CLIENT_READ_QUERY = "CLIENT_READ_QUERY",
  CLIENT_READ_FRAGMENT = "CLIENT_READ_FRAGMENT",
  CACHE_READ_QUERY = "CACHE_READ_QUERY",
  CACHE_READ_FRAGMENT = "CACHE_READ_FRAGMENT",
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
  affectedQueries: DocumentNode[]; // Re-rendered queries due to result of this operation
  affectedQueriesDueToOptimisticResponse?: DocumentNode[];
  cacheSnapshot: unknown;
  clientId: string;
  duration?: IVerboseOperationDuration | undefined; // amount of time spent in each phase
  error: unknown; // Error object in case of failure
  fetchPolicy: WatchQueryFetchPolicy | undefined;
  id: number; // operationId
  isActive?: boolean;
  isOptimistic?: boolean;
  operationName: string | undefined; // Name of operation
  operationString: string;
  operationType: OperationType; // Type of operation, whether its qquery, mutation, subscription
  optimisticResult?: IOperationResult;
  relatedOperations: IRelatedOperation;
  result: IOperationResult[]; // results of the operation.
  status: OperationStatus;
  timing: ITiming | undefined; // Time information relative to start recording at 0 seconds
  variables: OperationVariables | undefined;
  warning: unknown[] | undefined; // apollo client internal warning while reading data from cache
}

export interface IRelatedOperation {
  parentOperationId: number;
  childOperationIds: number[];
}

export enum OperationStatus {
  InFlight = "InFlight",
  Succeded = "Succeded",
  Failed = "Failed",
  PartialSuccess = "PartialSuccess",
  Unknown = "Unknown",
}
export enum InternalOperationStatus {
  InFlight = "InFlight",
  ResultFromCacheSucceded = "ResultFromCacheSucceded",
  ResultFromNetworkSucceded = "ResultFromNetworkSucceded",
  FailedToGetResultFromNetwork = "FailedToGetResultFromNetwork",
}

export interface IVerboseOperationDuration {
  totalTime: DOMHighResTimeStamp;
  requestExecutionTime: DOMHighResTimeStamp | string;
  cacheWriteTime: DOMHighResTimeStamp;
  cacheDiffTime: DOMHighResTimeStamp;
  cacheBroadcastWatchesTime: DOMHighResTimeStamp;
}
export interface IOperationResult {
  from: ResultsFrom;
  result: unknown;
  size: number;
}

export const Not_Available = "Not Available";

export interface IDataView {
  operations: IVerboseOperation[] | null;
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

export interface IAffectedQueryInternalMap {
  [key: string]: IAffectedQueryInternal;
}

export interface IAffectedQuery {
  affectedQueryName: string;
  dueToOperations: IDueToOperation[];
}

export interface IAffectedQueryInternal {
  affectedQueryName: string;
  dueToOperationsMap: { [key: number]: IDueToOperation };
}

export interface IDueToOperation {
  id: number; // operationId
  operationType: OperationType; // Type of operation, whether its qquery, mutation, subscription
  operationName: string | undefined; // Name of operation
}

export interface IInspectorTrackingConfig {
  tracking: {
    trackCacheOperation?: boolean;
    trackVerboseOperations?: boolean | ITrackVerboseOperationsConfig;
    trackAllOperations?: boolean;
  };
  hooks?: IHook[];
  apolloClientIds: string[];
  enableDebugger?: boolean;
}

export interface IInspectorObservableTrackingConfig
  extends IInspectorTrackingConfig {
  delayOperationsEmitByInMS?: number;
}

export interface IApolloClientObject {
  client: ApolloClient<NormalizedCacheObject>;
  clientId: string;
}

export interface ITrackVerboseOperationsConfig {
  cacheSnapshotAfterOperation?: ICacheSnapshotAfterOperationConfig;
}

export interface ICacheSnapshotAfterOperationConfig {
  operationsName: string[];
  enabled: boolean;
}

export declare class IHook {
  getLink: (getOperationId: () => number) => ApolloLink;
  transform: (op: IVerboseOperation) => IVerboseOperation;
}

export type IStopTracking = () => IDataView;
