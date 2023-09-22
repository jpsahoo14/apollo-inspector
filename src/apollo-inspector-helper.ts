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
} from "./interfaces";
import {
  recordOnlyWriteToCacheOperations,
  recordAllOperations,
  recordVerboseOperations,
} from "./recording";
import { Timer } from "timer-node";
import { Observer } from "rxjs";
import { extractOperations } from "./extract-operations";
import { throttle } from "lodash-es";

export const initializeRawData = (
  config: IInspectorTrackingConfig,
  listeners?: Observer<IDataView>[]
): IDataSetters => {
  const rawData: IApolloInspectorState = {
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
  };
  (window as any).rawData = rawData;
  const getRawData = () => rawData;
  const pushDataToObservers: () => void = throttle(() => {
    listeners?.forEach((listener) => {
      listener.next(extractOperations(getRawData(), config));
    });
  }, 50);

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
    updateData: ((state: IVerboseOperationMap) => void) | IVerboseOperationMap
  ) => {
    if (typeof updateData === "function") {
      updateData(rawData.verboseOperationsMap);
      pushDataToObservers();
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
