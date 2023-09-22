import {
  IInspectorTrackingConfig,
  IDataSetters,
  IStopTracking,
  IDataView,
  IApolloClientObject,
} from "./interfaces";
import { defaultConfig } from "./apollo-inspector-utils";
import { extractOperations } from "./extract-operations";
import {
  startRecordingInternal,
  initializeRawData,
} from "./apollo-inspector-helper";
import { Observable, Observer } from "rxjs";

export class ApolloInspector {
  private isRecording = false;
  private listeners: Observer<IDataView>[] = [];
  private cleanUps: (() => void)[] | undefined;
  private dataSetters: IDataSetters | undefined;
  private clientsMap: Map<string, IApolloClientObject>;

  constructor(clients: IApolloClientObject[]) {
    clients.forEach((client) => {
      this.clientsMap.set(client.cliendId, client);
    });
  }

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

  public startTrackingSubscription(
    config: IInspectorTrackingConfig = defaultConfig
  ): Observable<IDataView> {
    this.validateApolloClientIds(config.apolloClientIds);

    const observable = new Observable<IDataView>((observer) => {
      if (!this.isRecording) {
        this.setRecording(true);
        const dataSetters: IDataSetters = initializeRawData(
          config,
          this.listeners
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

        this.cleanUps = cleanUps;
        this.dataSetters = dataSetters;
      }
      this.listeners.push(observer);
      return this.removeListener.bind(this);
    });

    return observable;
  }

  private removeListener(observer: Observer<IDataView>) {
    const index = this.listeners.findIndex((ob) => ob === observer);
    this.listeners.splice(index, 1);
    if (this.listeners.length === 0) {
      this.setRecording(false);
      this.cleanUps?.forEach((cleanup) => {
        cleanup();
      });
      this.dataSetters?.getTimerInstance().stop();
      this.cleanUps = undefined;
      this.dataSetters = undefined;
    }
  }

  private setRecording(isRecording: boolean) {
    this.isRecording = isRecording;
  }

  private validateApolloClientIds(apolloClientIds: string[]) {
    let shouldThrow = false;
    apolloClientIds.every((id) => {
      if (!this.clientsMap.has(id)) {
        shouldThrow = true;
        return false;
      }
      return true;
    });

    if (shouldThrow) {
      throw new Error("Invalid clientId");
    }
  }
}
