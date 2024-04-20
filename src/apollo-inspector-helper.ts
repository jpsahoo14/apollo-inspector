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
  IDataView,
  IApolloClientObject,
  IInspectorObservableTrackingConfig,
  BaseOperation,
} from "./interfaces";
import {
  recordOnlyWriteToCacheOperations,
  recordAllOperations,
  recordVerboseOperations,
} from "./recording";
import { Timer } from "timer-node";
import { Observer } from "rxjs";
import { extractOperations, extracDirtyOperations } from "./extract-operations";
import { throttle } from "lodash-es";

export const initializeRawData = (
  config: IInspectorTrackingConfig | IInspectorObservableTrackingConfig,
  listeners?: Observer<IDataView>[]
): IDataSetters => {
  const rawData: IApolloInspectorState = initializeApolloInspectorState(config);
  (window as any).rawData = rawData;
  const getRawData = () => rawData;

  return {
    getRawData,
    setCacheOperations: getSetCacheOperations(getRawData()),
    setAllOperations: getSetAllOperations(getRawData()),
    setVerboseOperations: getSetVerboseOperations(getRawData(), () => {}),
    getTimerInstance: () => getRawData().timer,
  };
};

export const initializeRawDataAllOperationsObservableTracking = (
  config: IInspectorObservableTrackingConfig,
  listeners?: Observer<IDataView>[]
): IDataSetters => {
  const rawData: IApolloInspectorState = initializeApolloInspectorState(config);

  (window as any).rawData = rawData;
  const getRawData = () => rawData;
  const pushDataToObservers: () => void = throttle(() => {
    listeners?.forEach((listener) => {
      listener.next(extractOperations(getRawData(), config));
    });
  }, config.delayOperationsEmitByInMS || 0);

  return {
    getRawData,
    setCacheOperations: getSetCacheOperations(getRawData()),
    setAllOperations: getSetAllOperations(getRawData()),
    setVerboseOperations: getSetVerboseOperations(
      getRawData(),
      pushDataToObservers
    ),
    getTimerInstance: () => getRawData().timer,
  };
};

export const initializeRawDataObservableTracking = (
  config: IInspectorObservableTrackingConfig,
  listeners?: Observer<IDataView>[]
): IDataSetters => {
  const rawData: IApolloInspectorState = initializeApolloInspectorState(config);

  (window as any).rawData = rawData;
  const getRawData = () => rawData;
  const intervalNum = setInterval(() => {
    listeners?.forEach((listener) => {
      listener.next(extracDirtyOperations(getRawData(), config));
    });
  }, config.delayOperationsEmitByInMS || 1000);

  const cleanUps = [];
  cleanUps.push(() => {
    clearInterval(intervalNum);
  });

  return {
    getRawData,
    setCacheOperations: getSetCacheOperations(getRawData()),
    setAllOperations: getSetAllOperations(getRawData()),
    setVerboseOperations: getSetVerboseOperations(getRawData(), () => {}),
    getTimerInstance: () => getRawData().timer,
    cleanUps,
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
  rawData: IApolloInspectorState,
  pushDataToObservers: () => void
): ISetVerboseOperations => {
  return (
    updateData: (
      state: IVerboseOperationMap
    ) => BaseOperation | null | undefined
  ) => {
    if (typeof updateData === "function") {
      const operation = updateData(rawData.verboseOperationsMap);
      pushDataToObservers();
      operation?.markDirty();
      return;
    }
    rawData.verboseOperationsMap = updateData;
    pushDataToObservers();
  };
};

export const startRecordingInternal = ({
  clientObj,
  config,
  dataSetters,
}: {
  clientObj: IApolloClientObject;
  config: IInspectorTrackingConfig;
  dataSetters: IDataSetters;
}) => {
  const cleanups: (() => void)[] = [];
  if (config.tracking.trackCacheOperation) {
    const cleanUpWriteToCache = recordOnlyWriteToCacheOperations(
      clientObj,
      dataSetters.setCacheOperations
    );
    cleanups.push(cleanUpWriteToCache);
  }

  if (config.tracking.trackAllOperations) {
    const cleanUpAllOperation = recordAllOperations(
      clientObj,
      dataSetters.setAllOperations
    );
    cleanups.push(cleanUpAllOperation);
  }

  const cleanUpVerboseOperations = recordVerboseOperations(
    clientObj,
    dataSetters.setVerboseOperations,
    dataSetters.getRawData(),
    config
  );
  cleanups.push(cleanUpVerboseOperations);

  return cleanups;
};

const initializeApolloInspectorState = (
  config: IInspectorTrackingConfig | IInspectorObservableTrackingConfig
) => ({
  operations: [],
  verboseOperationsMap: new Map(),
  allOperations: {},
  mutationToMutationId: new Map(),
  operationIdToApolloOpId: new Map(),
  queryInfoToOperationId: new Map(),
  currentOperationId: 0,
  operationIdCounter: 0,
  broadcastQueriesOperationId: 0,
  enableDebug: false,
  timer: new Timer().start(),
  config,
});
