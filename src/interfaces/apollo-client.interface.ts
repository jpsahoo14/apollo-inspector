import { DocumentNode } from "graphql";
import {
  OperationVariables,
  FetchResult,
  ErrorPolicy,
  InMemoryCache,
  FetchPolicy,
  MutationUpdaterFunction,
  InternalRefetchQueriesInclude,
  OnQueryUpdated,
  MutationOptions,
} from "@apollo/client";
import type {
  ApolloCacheDiff,
  ApolloObservableQueryWithInternals,
  ApolloQueryInfoWithInternals,
  ApolloQueryManagerWithInternals,
  FetchConcastWithInfo,
  FetchConcastWithInfoParams,
  FetchConcastWithInfoResult,
  FetchQueryByPolicyParams,
  FetchQueryObservable,
  FetchQueryObservableOptions,
  FetchQueryObservableParams,
  GetObservableFromLinkArgs,
  GetResultsFromLinkArgs,
} from "../apollo-client-internals";

export type IDiff = ApolloCacheDiff;

export interface IMissing {
  message: string;
  path: string;
}

export interface IApolloClient {
  queryManager: IQueryManager;
  mutate: () => void;
  watchQuery: () => void;
}
export type IQueryManager = ApolloQueryManagerWithInternals;

export type IGetResultsFromLinkArgs = GetResultsFromLinkArgs;

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

export type IQueryManagerDefaultOptions = IQueryManager["defaultOptions"];
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

export type IGetObservableFromLinkArgs = GetObservableFromLinkArgs;

export type IFetchQueryObservable = FetchQueryObservable;

export type IFetchConcastWithInfo = FetchConcastWithInfo;

export type IFetchConcastWithInfoParams = FetchConcastWithInfoParams;

export type IFetchConcastWithInfoResult = FetchConcastWithInfoResult;

export type IFetchQueryByPolicy = FetchQueryByPolicyParams;

export type IFetchQueryObservableParams = FetchQueryObservableParams;

export type IFetchQueryByPolicyOptions = FetchQueryByPolicyParams[1];

export type IQueryInfo = ApolloQueryInfoWithInternals;

export type IObservableQuery = ApolloObservableQueryWithInternals;

export type IObservableQueryReportResult = Parameters<
  ApolloObservableQueryWithInternals["reportResult"]
>;

export type IFetchQueryObservableOptions = FetchQueryObservableOptions;

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
