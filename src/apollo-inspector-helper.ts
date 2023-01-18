import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  IInspectorTrackingConfig,
  IApolloInspectorState,
  IApolloOperation,
  IAllOperations,
  IVerboseOperationMap,
  IDataSetters,
  ISetCacheOperations,
  ISetAllOperations,
  ISetVerboseOperations,
} from "./interfaces";
import {
  recordOnlyWriteToCacheOperations,
  recordAllOperations,
  recordVerboseOperations,
} from "./recording";
import { Timer } from "timer-node";

export const initializeRawData = (): IDataSetters => {
  const rawData: IApolloInspectorState = {
    operations: [],
    verboseOperationsMap: new Map(),
    allOperations: {},
    mutationToMutationId: new Map(),
    operationIdToApolloOpId: new Map(),
    queryInfoToOperationId: new Map(),
    currentOperationId: 0,
    operationIdCounter: 0,
    enableDebug: false,
    timer: new Timer().start(),
  };
  (window as any).rawData = rawData;
  const getRawData = () => rawData;

  return {
    getRawData,
    setCacheOperations: getSetCacheOperations(getRawData()),
    setAllOperations: getSetAllOperations(getRawData()),
    setVerboseOperations: getSetVerboseOperations(getRawData()),
    getTimerInstance: () => getRawData().timer,
  };
};

const getSetCacheOperations = (
  rawData: IApolloInspectorState
): ISetCacheOperations => {
  return (
    updateData: ((state: IApolloOperation[]) => void) | IApolloOperation[]
  ) => {
    if (typeof updateData === "function") {
      updateData(rawData.operations);
      return;
    }
    rawData.operations = updateData;
  };
};

const getSetAllOperations = (
  rawData: IApolloInspectorState
): ISetAllOperations => {
  return (updateData: ((state: IAllOperations) => void) | IAllOperations) => {
    if (typeof updateData === "function") {
      updateData(rawData.allOperations);
      return;
    }
    rawData.allOperations = updateData;
  };
};

const getSetVerboseOperations = (
  rawData: IApolloInspectorState
): ISetVerboseOperations => {
  return (
    updateData: ((state: IVerboseOperationMap) => void) | IVerboseOperationMap
  ) => {
    if (typeof updateData === "function") {
      updateData(rawData.verboseOperationsMap);
      return;
    }
    rawData.verboseOperationsMap = updateData;
  };
};

export const startRecordingInternal = ({
  client,
  config,
  dataSetters,
}: {
  client: ApolloClient<NormalizedCacheObject>;
  config: IInspectorTrackingConfig;
  dataSetters: IDataSetters;
}) => {
  const cleanups: (() => void)[] = [];
  if (config.tracking.trackCacheOperation) {
    const cleanUpWriteToCache = recordOnlyWriteToCacheOperations(
      client,
      dataSetters.setCacheOperations
    );
    cleanups.push(cleanUpWriteToCache);
  }

  if (config.tracking.trackAllOperations) {
    const cleanUpAllOperation = recordAllOperations(
      client,
      dataSetters.setAllOperations
    );
    cleanups.push(cleanUpAllOperation);
  }

  const cleanUpVerboseOperations = recordVerboseOperations(
    client,
    dataSetters.setVerboseOperations,
    dataSetters.getRawData(),
    config
  );
  cleanups.push(cleanUpVerboseOperations);

  return cleanups;
};
