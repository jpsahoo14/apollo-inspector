import { DocumentNode } from "graphql";
import {
  WatchQueryFetchPolicy,
  OperationVariables,
  Observable,
  FetchResult,
  ErrorPolicy,
  InMemoryCache,
  FetchPolicy,
  MutationUpdaterFunction,
  InternalRefetchQueriesInclude,
  OnQueryUpdated,
  MutationOptions,
  ApolloQueryResult,
} from "@apollo/client";
import { CacheWriteBehavior, QueryInfo } from "@apollo/client/core/QueryInfo";

export interface IDiff {
  result: unknown;
  missing: IMissing[];
  complete: boolean;
}

export interface IMissing {
  message: string;
  path: string;
}

export interface IApolloClient {
  queryManager: IQueryManager;
  mutate: () => void;
  watchQuery: () => void;
}
export interface IQueryManager {
  queries: Map<string, IQueryInfo>;
  getObservableFromLink: (
    ...args: IGetObservableFromLinkArgs
  ) => Observable<unknown>;
  inFlightLinkObservables: Map<
    DocumentNode,
    Map<string, Observable<FetchResult>>
  >;
  fetchQueryObservable: IFetchQueryObservable;
  getQuery: (queryId: number) => unknown;
  fetchQueryByPolicy: (...args: IFetchQueryByPolicy) => unknown;
  markMutationResult: (...args: IMarkMutationResultArgs) => unknown;
  markMutationOptimistic: (...args: IMarkMutationOptimisticArgs) => unknown;
  defaultOptions: IQueryManagerDefaultOptions;
  broadcastQueries: () => void;
  getResultsFromLink: (
    ...args: IGetResultsFromLinkArgs
  ) => Observable<ApolloQueryResult<any>>;
}

export type IGetResultsFromLinkArgs = [QueryInfo, CacheWriteBehavior, any];

export type IMarkMutationOptimisticArgs = [unknown, IMutationOperation];

export interface IMutationOperation {
  mutationId: string;
  document: DocumentNode;
  variables?: OperationVariables;
  fetchPolicy?: MutationFetchPolicy;
  errorPolicy: ErrorPolicy;
  context?: unknown;
  updateQueries: MutationOptions["updateQueries"];
  update?: MutationUpdaterFunction<
    unknown,
    OperationVariables,
    unknown,
    InMemoryCache
  >;
  awaitRefetchQueries?: boolean;
  refetchQueries?: InternalRefetchQueriesInclude;
  removeOptimistic?: string;
  onQueryUpdated?: OnQueryUpdated<any>;
  keepRootFields?: boolean;
  operationId: number;
}

export interface IQueryManagerDefaultOptions {
  mutate?: {
    fetchPolicy: MutationFetchPolicy;
  };
}
export type MutationFetchPolicy = Extract<
  FetchPolicy,
  "network-only" | "no-cache"
>;

export interface ICache {
  data: { data: unknown };
}

export type IMarkMutationResultArgs = [IMutationResult, InMemoryCache];

export type IMutationResult = IMutationOperation & {
  result: FetchResult<any>;
};

export type IGetObservableFromLinkArgs = [
  DocumentNode,
  { queryDeduplication: boolean },
  OperationVariables,
  boolean,
];

export type IFetchQueryObservable = (
  ...args: IFetchQueryObservableParams
) => Observable<unknown>;

export type IFetchQueryByPolicy = [IQueryInfo, IFetchQueryByPolicyOptions];

export type IFetchQueryObservableParams = [
  number,
  IFetchQueryObservableOptions,
];

export interface IFetchQueryByPolicyOptions {
  fetchPolicy: WatchQueryFetchPolicy;
  variables: OperationVariables | undefined;
}

export interface IQueryInfo {
  observableQuery?: IObservableQuery;
  getDiff: (variables: OperationVariables | undefined) => IDiff;
  document: DocumentNode;
  shouldNotify: () => boolean;
}

export interface IObservableQuery {
  queryId: number;
  reportResult: (...args: IObservableQueryReportResult) => void;
}

export type IObservableQueryReportResult = [any, any];

export interface IFetchQueryObservableOptions {
  errorPolicy: ErrorPolicy;
  fetchPolicy: WatchQueryFetchPolicy;
  query: DocumentNode;
  variables: OperationVariables | undefined;
}

export interface IQueryInfo {
  document: DocumentNode;
  dirty: boolean;
  markResult: () => void;
}

export interface IApolloClientCache {
  broadcastWatches: (...args: IBroadcastWatches) => void;
  write: (...args: IApolloClientCacheWriteParams) => void;
}

export type IApolloClientCacheWriteParams = [
  IIApolloClientCacheWriteParamObject,
];
export type IIApolloClientCacheWriteParamObject = {
  dataId: "ROOT_SUBSCRIPTION";
  query: DocumentNode;
  result: unknown;
  variables: OperationVariables;
};

export type IBroadcastWatches = [];
export type ICacheDiffParams = [];
