import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
} from "../interfaces";
import {
  setTrackLink,
  overrideFetchQueryByPolicy,
  overrideFetchQueryObservable,
  overrideQueryInfoMarkResult,
} from "./record-verbose-operation";

export const recordVerboseOperations = (
  client: ApolloClient<InMemoryCache>,
  setVerboseApolloOperations: ISetVerboseApolloOperations,
  rawData: IApolloInspectorState
) => {
  const selectedApolloClient: ApolloClient<InMemoryCache> = client;

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

  return () => {
    revertSetTrackLink();
    revertFetchQueryObservable();
    revertMarkResult();
    revertFetchQueryByPolicy();
  };
};
