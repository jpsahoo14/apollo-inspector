import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IInspectorTrackingConfig,
  IDebugOperation,
} from "../interfaces";
import {
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
import { trackLink, setLinkInFront } from "../links";

export const recordVerboseOperations = (
  client: ApolloClient<NormalizedCacheObject>,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  rawData: IApolloInspectorState,
  config: IInspectorTrackingConfig
) => {
  const selectedApolloClient: ApolloClient<NormalizedCacheObject> = client;

  const methods = [
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

  const revertTrackLink = setLinkInFront(
    client,
    trackLink(rawData, setVerboseApolloOperations)
  );
  revertMethods.push(revertTrackLink);

  const setOperation = (cb: (op: IDebugOperation) => IDebugOperation) => {
    const operation = rawData.verboseOperationsMap.get(
      rawData.currentOperationId
    );
    if (operation) {
      const updatedOperation = cb(operation);
      rawData.verboseOperationsMap.set(
        rawData.currentOperationId,
        updatedOperation
      );
    }
  };

  config.hooks?.forEach((hook) => {
    const link = hook.getLink(setOperation);
    const revertLink = setLinkInFront(client, link);
    revertMethods.push(revertLink);
  });

  return () => {
    revertMethods.forEach((rm) => rm());
  };
};
