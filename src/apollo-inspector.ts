import { ApolloClient, InMemoryCache } from "@apollo/client";
import { IInspectorTrackingConfig, IDataSetters } from "./interfaces";
import { defaultConfig } from "./apollo-inspector-utils";
import { extractOperations } from "./extract-operations";
import {
  startRecordingInternal,
  initializeRawData,
} from "./apollo-inspector-helper";

export class ApolloInspector {
  private isRecording = false;
  constructor(private client: ApolloClient<InMemoryCache>) {}

  public startTracking(config: IInspectorTrackingConfig | undefined) {
    if (this.isRecording == true) {
      throw new Error("Recording already in progress");
    }

    if (!config) {
      config = defaultConfig;
    }
    this.setRecording(true);
    const dataSetters: IDataSetters = initializeRawData();

    const cleanUps = startRecordingInternal({
      client: this.client,
      config,
      dataSetters,
    });

    return () => {
      this.setRecording(false);
      cleanUps.forEach((cleanup) => {
        cleanup();
      });
      return extractOperations(dataSetters.getRawData());
    };
  }

  private setRecording(isRecording: boolean) {
    this.isRecording = isRecording;
  }
}
