import type {
  ApolloClient,
  ApolloQueryResult,
  ErrorPolicy,
  FetchResult,
  NormalizedCacheObject,
  Observable,
  OperationVariables,
  WatchQueryFetchPolicy,
} from "@apollo/client";
import { isNetworkRequestInFlight } from "@apollo/client/core/networkStatus";
import type { NetworkStatus } from "@apollo/client/core/networkStatus";
import type {
  CacheWriteBehavior,
  QueryInfo,
} from "@apollo/client/core/QueryInfo";
import { canonicalStringify } from "@apollo/client/utilities";
import { print } from "graphql";
import type { DocumentNode } from "graphql";

type CollectionLike = { size?: number; length?: number };

export type ObservableWithPromise<T = unknown> = Observable<T> & {
  promise?: Promise<T>;
};

export type ObservableSubscriptionLike = { unsubscribe: () => void };

export type FetchQueryObservableOptions = {
  errorPolicy?: ErrorPolicy;
  fetchPolicy?: WatchQueryFetchPolicy;
  query: DocumentNode;
  variables: OperationVariables | undefined;
};

export type ApolloCacheDiff = {
  complete?: boolean;
  missing?: { message?: unknown; path?: unknown }[];
  result?: unknown;
};

export type FetchQueryObservableParams = [
  string,
  FetchQueryObservableOptions,
  NetworkStatus?,
];

export type FetchQueryObservable = (
  ...args: FetchQueryObservableParams
) => ObservableWithPromise<ApolloQueryResult<unknown>>;

export type FetchConcastWithInfoParams = [
  ApolloQueryInfoWithInternals,
  FetchQueryObservableOptions,
  NetworkStatus?,
  DocumentNode?,
];

export type FetchConcastWithInfoResult = {
  concast: ObservableWithPromise<ApolloQueryResult<unknown>>;
  fromLink: boolean;
};

export type FetchConcastWithInfo = (
  ...args: FetchConcastWithInfoParams
) => FetchConcastWithInfoResult;

export type FetchQueryByPolicyParams = [
  ApolloQueryInfoWithInternals,
  {
    fetchPolicy: WatchQueryFetchPolicy;
    variables: OperationVariables | undefined;
  },
];

export type GetObservableFromLinkArgs = [
  DocumentNode,
  { queryDeduplication?: boolean },
  OperationVariables,
  boolean | Record<string, unknown> | undefined,
  boolean?,
];

type TransformedDocumentInfo = {
  clientQuery?: DocumentNode | null;
  serverQuery?: DocumentNode | null;
};

type InFlightLinkObservables =
  | Map<DocumentNode, Map<string, Observable<FetchResult>>>
  | {
      peek?: (...keys: string[]) => { observable?: Observable<FetchResult> };
    };

export type GetResultsFromLinkArgs = [
  ApolloQueryInfoWithInternals,
  CacheWriteBehavior,
  unknown,
];

export type ApolloObservableQueryWithInternals = {
  queryId: string;
  dirty?: boolean;
  observers?: CollectionLike;
  options?: { fetchPolicy?: WatchQueryFetchPolicy };
  hasObservers?: () => boolean;
  reportResult: (...args: [any, any]) => void;
};

export type ApolloQueryInfoWithInternals = Omit<
  QueryInfo,
  "document" | "getDiff" | "markResult" | "observableQuery"
> & {
  queryId: string;
  document: DocumentNode | null;
  dirty?: boolean;
  getDiff: (variables?: OperationVariables) => ApolloCacheDiff;
  listeners?: CollectionLike;
  markResult: (...args: unknown[]) => unknown;
  observableQuery?: ApolloObservableQueryWithInternals | null;
  shouldNotify?: () => boolean;
};

export type ApolloQueryManagerWithInternals = {
  queries: Map<string, ApolloQueryInfoWithInternals>;
  getObservableFromLink: (
    ...args: GetObservableFromLinkArgs
  ) => Observable<unknown>;
  inFlightLinkObservables: InFlightLinkObservables;
  queryDeduplication?: boolean;
  fetchQueryObservable?: FetchQueryObservable;
  fetchConcastWithInfo?: FetchConcastWithInfo;
  getQuery?: (queryId: string) => ApolloQueryInfoWithInternals;
  getOrCreateQuery?: (queryId: string) => ApolloQueryInfoWithInternals;
  fetchQueryByPolicy: (...args: FetchQueryByPolicyParams) => unknown;
  markMutationResult: (...args: unknown[]) => unknown;
  markMutationOptimistic: (...args: unknown[]) => unknown;
  defaultOptions: {
    mutate?: {
      fetchPolicy: "network-only" | "no-cache";
    };
  };
  broadcastQueries: () => void;
  getResultsFromLink: (
    ...args: GetResultsFromLinkArgs
  ) => Observable<ApolloQueryResult<any>>;
  getDocumentInfo?: (document: DocumentNode) => TransformedDocumentInfo;
  transform: (document: DocumentNode) => DocumentNode | TransformedDocumentInfo;
};

export const getApolloQueryManager = (
  client: ApolloClient<NormalizedCacheObject>,
) => {
  return (
    client as unknown as { queryManager: ApolloQueryManagerWithInternals }
  ).queryManager;
};

export const getQueryInfo = (
  queryManager: ApolloQueryManagerWithInternals,
  queryId: string,
) => {
  if (typeof queryManager.getOrCreateQuery === "function") {
    return queryManager.getOrCreateQuery(queryId);
  }

  if (typeof queryManager.getQuery === "function") {
    return queryManager.getQuery(queryId);
  }

  throw new Error("Apollo QueryManager does not expose a query lookup method");
};

export const getDocumentInfo = (
  queryManager: ApolloQueryManagerWithInternals,
  document: DocumentNode,
) => {
  if (typeof queryManager.getDocumentInfo === "function") {
    return queryManager.getDocumentInfo(document);
  }

  return queryManager.transform(document) as TransformedDocumentInfo;
};

export const hasInFlightLinkObservable = (
  queryManager: ApolloQueryManagerWithInternals,
  serverQuery: DocumentNode | null | undefined,
  variables: OperationVariables,
) => {
  if (!serverQuery) {
    return false;
  }

  const inFlightLinkObservables = queryManager.inFlightLinkObservables;

  if (inFlightLinkObservables instanceof Map) {
    const byVariables = inFlightLinkObservables.get(serverQuery);
    return !!byVariables?.get(JSON.stringify(variables));
  }

  if (typeof inFlightLinkObservables.peek === "function") {
    const entry = inFlightLinkObservables.peek(
      print(serverQuery),
      canonicalStringify(variables),
    );
    return !!entry?.observable;
  }

  return false;
};

const hasItems = (collection?: CollectionLike | null) => {
  if (!collection) {
    return false;
  }

  if (typeof collection.size === "number") {
    return collection.size > 0;
  }

  if (typeof collection.length === "number") {
    return collection.length > 0;
  }

  return false;
};

export const shouldNotifyQueryInfo = (
  queryInfo: ApolloQueryInfoWithInternals,
) => {
  if (typeof queryInfo.shouldNotify === "function") {
    return queryInfo.shouldNotify();
  }

  const observableQuery = queryInfo.observableQuery;
  const isDirty =
    typeof observableQuery?.dirty === "boolean"
      ? observableQuery.dirty
      : !!queryInfo.dirty;
  const hasNotificationTarget =
    hasItems(queryInfo.listeners) ||
    (typeof observableQuery?.hasObservers === "function"
      ? observableQuery.hasObservers()
      : hasItems(observableQuery?.observers));

  if (!isDirty || !hasNotificationTarget) {
    return false;
  }

  if (isNetworkRequestInFlight(queryInfo.networkStatus) && observableQuery) {
    const fetchPolicy = observableQuery.options?.fetchPolicy;
    return fetchPolicy === "cache-only" || fetchPolicy === "cache-and-network";
  }

  return true;
};
