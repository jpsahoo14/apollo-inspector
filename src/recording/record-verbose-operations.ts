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
  overrideMutate,
  overrideMarkMutationResult,
  overrideGetObservableFromLink,
} from "./record-verbose-operation";

export const recordVerboseOperations = (
  client: ApolloClient<NormalizedCacheObject>,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  rawData: IApolloInspectorState
) => {
  const selectedApolloClient: ApolloClient<NormalizedCacheObject> = client;

  const methods = [
    setTrackLink,
    overrideFetchQueryObservable,
    overrideQueryInfoMarkResult,
    overrideFetchQueryByPolicy,
    overrideCacheBroadcastWatches,
    overrideCacheDiff,
    overrideCacheWrite,
    overrideMutate,
    overrideMarkMutationResult,
    overrideGetObservableFromLink,
  ];
  const revertMethods: (() => void)[] = [];
  methods.forEach((m) => {
    const revertFun = m.call(
      null,
      selectedApolloClient,
      rawData,
      setVerboseApolloOperations
    );
    revertMethods.push(revertFun);
  });

  return () => {
    revertMethods.forEach((rm) => rm());
  };
};
