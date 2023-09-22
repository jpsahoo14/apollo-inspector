import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IInspectorTrackingConfig,
  IApolloClientObject,
} from "../interfaces";
import {
  overrideFetchQueryByPolicy,
  overrideFetchQueryObservable,
  overrideCacheBroadcastWatches,
  overrideCacheDiff,
  overrideCacheWrite,
  overrideMutate,
  overrideGetObservableFromLink,
  overrideCacheWriteFragment,
  overrideCacheWriteQuery,
  overrideClientWriteFragment,
  overrideClientWriteQuery,
  overrideCacheReadFragment,
  overrideCacheReadQuery,
  overrideClientReadFragment,
  overrideClientReadQuery,
  overrideMarkMutationResult,
  overrideMarkMutationOptimistic,
  overrideBroadcastQueries,
  overrideGetResultsFromLink,
} from "./record-verbose-operation";
import { trackLink, setLinkInFront } from "../links";

export const recordVerboseOperations = (
  clientObj: IApolloClientObject,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  rawData: IApolloInspectorState,
  config: IInspectorTrackingConfig
) => {
  const selectedApolloClient: ApolloClient<NormalizedCacheObject> =
    clientObj.client;

  const methods: ((
    clientObj: IApolloClientObject,
    rawData: IApolloInspectorState,
    setVerboseApolloOperations: ISetVerboseApolloOperations
  ) => () => void)[] = [
    overrideFetchQueryObservable,
    overrideFetchQueryByPolicy,
    overrideCacheBroadcastWatches,
    overrideCacheDiff,
    overrideCacheWrite,
    overrideMutate,
    overrideGetObservableFromLink,
    overrideCacheWriteFragment,
    overrideCacheWriteQuery,
    overrideClientWriteFragment,
    overrideClientWriteQuery,
    overrideCacheReadFragment,
    overrideCacheReadQuery,
    overrideClientReadFragment,
    overrideClientReadQuery,
    overrideMarkMutationResult,
    overrideMarkMutationOptimistic,
    overrideBroadcastQueries,
    overrideGetResultsFromLink,
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

  const revertTrackLink = setLinkInFront(
    selectedApolloClient,
    trackLink(rawData, setVerboseApolloOperations)
  );
  revertMethods.push(revertTrackLink);

  const getOperationId = () => {
    return rawData.currentOperationId;
  };

  config.hooks?.forEach((hook) => {
    const link = hook.getLink(getOperationId);
    const revertLink = setLinkInFront(selectedApolloClient, link);
    revertMethods.push(revertLink);
  });

  return () => {
    revertMethods.forEach((rm) => rm());
  };
};
