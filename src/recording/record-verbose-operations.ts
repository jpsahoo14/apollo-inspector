import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
} from "../interfaces";
import {
  setTrackLink,
  overrideFetchQueryByPolicy,
  overrideFetchQueryObservable,
  overrideQueryInfoMarkResult,
  overrideCacheBroadcastWatches,
  overrideCacheDiff,
  overrideCacheWrite,
} from "./record-verbose-operation";

export const recordVerboseOperations = (
  client: ApolloClient<NormalizedCacheObject>,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  rawData: IApolloInspectorState
) => {
  const selectedApolloClient: ApolloClient<NormalizedCacheObject> = client;

  const revertSetTrackLink = setTrackLink(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );

  const revertFetchQueryObservable = overrideFetchQueryObservable(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );
  const revertMarkResult = overrideQueryInfoMarkResult(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );

  const revertFetchQueryByPolicy = overrideFetchQueryByPolicy(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );

  const revertCacheBroadcastWatches = overrideCacheBroadcastWatches(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );
  const revertCacheDiff = overrideCacheDiff(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );
  const revertCacheWrite = overrideCacheWrite(
    selectedApolloClient,
    rawData,
    setVerboseApolloOperations
  );

  return () => {
    revertSetTrackLink();
    revertFetchQueryObservable();
    revertMarkResult();
    revertFetchQueryByPolicy();
    revertCacheBroadcastWatches();
    revertCacheDiff();
    revertCacheWrite();
  };
};
