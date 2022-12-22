import { DocumentNode } from "graphql";
import {
  WatchQueryFetchPolicy,
  OperationVariables,
  Observable,
  FetchResult,
  ErrorPolicy,
} from "@apollo/client";

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
  getObservableFromLink: () => Observable<unknown>;
  inFlightLinkObservables: Map<
    DocumentNode,
    Map<string, Observable<FetchResult>>
  >;
  fetchQueryObservable: IFetchQueryObservable;
  getQuery: (queryId: number) => unknown;
  fetchQueryByPolicy: (...args: IFetchQueryByPolicy) => unknown;
}

export type IFetchQueryObservable = (
  ...args: IFetchQueryObservableParams
) => Observable<unknown>;

export type IFetchQueryByPolicy = [IQueryInfo, IFetchQueryByPolicyOptions];

export type IFetchQueryObservableParams = [
  number,
  IFetchQueryObservableOptions
];

export interface IFetchQueryByPolicyOptions {
  fetchPolicy: WatchQueryFetchPolicy;
  variables: OperationVariables | undefined;
}

export interface IQueryInfo {
  observableQuery?: IObservableQuery;
  getDiff: (variables: OperationVariables | undefined) => IDiff;
}

export interface IObservableQuery {
  queryId: number;
}
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

export type IApolloClientCacheWriteParams = [];

export type IBroadcastWatches = [];
export type ICacheDiffParams = [];
