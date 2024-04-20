import {
  IInspectorTrackingConfig,
  IDataSetters,
  IStopTracking,
  IDataView,
  IApolloClientObject,
  IInspectorObservableTrackingConfig,
} from "./interfaces";
import { defaultConfig } from "./apollo-inspector-utils";
import { extractOperations } from "./extract-operations";
import {
  startRecordingInternal,
  initializeRawData,
  initializeRawDataObservableTracking,
  initializeRawDataAllOperationsObservableTracking,
} from "./apollo-inspector-helper";
import { Observable, Observer } from "rxjs";

export class ApolloInspector {
  private isRecording = false;
  private clientsMap: Map<string, IApolloClientObject>;

  constructor(clients: IApolloClientObject[]) {
    this.clientsMap = new Map<string, IApolloClientObject>();
    clients.forEach((clientObj: IApolloClientObject) => {
      this.clientsMap.set(clientObj.clientId, clientObj);
    });
  }

  /**
   * Returns a function, upon calling this function it returns all the
   * operations executed within the time frame
   * @param config
   * @returns
   */
  public startTracking(
    config: IInspectorTrackingConfig = defaultConfig
  ): IStopTracking {
    if (this.isRecording == true) {
      throw new Error("Recording already in progress");
    }

    this.validateApolloClientIds(config.apolloClientIds);

    this.setRecording(true);
    const dataSetters: IDataSetters = initializeRawData(config);
    const cleanUps: (() => void)[] = [];

    config.apolloClientIds.forEach((clientId) => {
      const clientObj = this.clientsMap.get(clientId) as IApolloClientObject;
      const cleanUpRecordings = startRecordingInternal({
        clientObj,
        config,
        dataSetters,
      });
      cleanUps.push(...cleanUpRecordings);
    });

    return () => {
      this.setRecording(false);
      cleanUps.forEach((cleanup) => {
        cleanup();
      });
      dataSetters.getTimerInstance().stop();
      return extractOperations(dataSetters.getRawData(), config);
    };
  }

  /**
   * Returns an observable, to which one can subscribe and listen to
   * ongoing operations in real-time. This emits only changed operations
   * @param config
   * @returns
   */
  public startTrackingSubscription(
    config: IInspectorObservableTrackingConfig = defaultConfig
  ): Observable<IDataView> {
    this.validateApolloClientIds(config.apolloClientIds);

    const listeners: Observer<IDataView>[] = [];
    let cleanUpsGlobal: (() => void)[] | undefined;
    let dataSettersGlobal: IDataSetters | undefined;

    const observable = new Observable<IDataView>((observer) => {
      if (!this.isRecording) {
        this.setRecording(true);
        const dataSetters: IDataSetters = initializeRawDataObservableTracking(
          config,
          listeners
        );

        const cleanUps: (() => void)[] = [];
        config.apolloClientIds.forEach((clientId) => {
          const clientObj = this.clientsMap.get(
            clientId
          ) as IApolloClientObject;
          const cleanUpRecordings = startRecordingInternal({
            clientObj,
            config,
            dataSetters,
          });
          cleanUps.push(...cleanUpRecordings);
        });

        cleanUpsGlobal = cleanUps;
        dataSettersGlobal = dataSetters;
      }

      listeners.push(observer);

      return {
        unsubscribe: () => {
          this.removeListener(
            observer,
            listeners,
            cleanUpsGlobal,
            dataSettersGlobal
          );
        },
      };
    });

    return observable;
  }

  /**
   * Returns an observable, to which one can subscribe and listen to
   * ongoing operations in real-time. This emits all the operations
   * always
   * @param config
   * @returns
   */
  public startTrackingAllOperationsSubscription(
    config: IInspectorObservableTrackingConfig = defaultConfig
  ): Observable<IDataView> {
    this.validateApolloClientIds(config.apolloClientIds);

    const listeners: Observer<IDataView>[] = [];
    let cleanUpsGlobal: (() => void)[] | undefined;
    let dataSettersGlobal: IDataSetters | undefined;

    const observable = new Observable<IDataView>((observer) => {
      if (!this.isRecording) {
        this.setRecording(true);
        const dataSetters: IDataSetters =
          initializeRawDataAllOperationsObservableTracking(config, listeners);

        const cleanUps: (() => void)[] = [];

        config.apolloClientIds.forEach((clientId) => {
          const clientObj = this.clientsMap.get(
            clientId
          ) as IApolloClientObject;
          const cleanUpRecordings = startRecordingInternal({
            clientObj,
            config,
            dataSetters,
          });
          cleanUps.push(...cleanUpRecordings);
        });

        cleanUpsGlobal = cleanUps;
        dataSettersGlobal = dataSetters;
      }
      listeners.push(observer);
      return {
        unsubscribe: () => {
          this.removeListener(
            observer,
            listeners,
            cleanUpsGlobal,
            dataSettersGlobal
          );
        },
      };
    });

    return observable;
  }

  private removeListener(
    observer: Observer<IDataView>,
    listeners: Observer<IDataView>[],
    cleanUps: (() => void)[] | undefined,
    dataSetters: IDataSetters | undefined
  ) {
    const index = listeners.findIndex((ob) => ob === observer);
    listeners.splice(index, 1);
    if (listeners.length === 0) {
      this.setRecording(false);
      cleanUps?.forEach((cleanup: () => void) => {
        cleanup();
      });
      dataSetters?.getTimerInstance().stop();
      dataSetters?.cleanUps?.forEach((cleanUp) => cleanUp());
    }
  }

  private setRecording(isRecording: boolean) {
    this.isRecording = isRecording;
  }

  private validateApolloClientIds(apolloClientIds: string[]) {
    let invalidClientId = null;
    apolloClientIds.every((id) => {
      if (!this.clientsMap.has(id)) {
        invalidClientId = id;
        return false;
      }
      return true;
    });

    if (invalidClientId !== null) {
      throw new Error(`Invalid clientId: ${invalidClientId}`);
    }
  }
}
