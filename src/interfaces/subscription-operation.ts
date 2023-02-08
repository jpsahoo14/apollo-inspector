import { WatchQueryFetchPolicy } from "@apollo/client";
import { IDebugOperation, IDebugOperationConstructor } from "./debug-operation";
import { IDiff } from "./apollo-client.interface";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
} from "./apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { print } from "graphql";

export interface ISubscriptionOperationConstructor
  extends IDebugOperationConstructor {}

export class SubscriptionOperation extends IDebugOperation {
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];

  public deduplication: boolean;
  public diff: IDiff | undefined;
  public piggyBackOnExistingObservable: boolean;
  public fetchPolicy: WatchQueryFetchPolicy | "no-cache" | undefined;

  constructor({
    dataId,
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
  }: ISubscriptionOperationConstructor) {
    super({
      dataId,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
    });

    this._operationStage = OperationStage.startGraphQLSubscription;
    this._operationStages = [OperationStage.startGraphQLSubscription];
    this.deduplication = true;
    this.piggyBackOnExistingObservable = false;
    const val = false;
  }

  public setOperationStage(opStage: OperationStage) {
    this._operationStages.push(opStage);
    if (opStage == OperationStage.addedDataToCache) {
      this.timing.dataWrittenToCacheCompletedAt = this.timer.getCurrentMs();
    }
  }

  public addResult(result: unknown) {
    const clonedResult = cloneDeep(result);
    this._result.push({ from: ResultsFrom.NETWORK, result: clonedResult });
  }

  public getOperationInfo(): IVerboseOperation {
    const operationName = getOperationNameV2(this._query);
    const operationString = print(this._query);

    return {
      id: this._id,
      operationType: this.getOperationType(),
      operationName,
      operationString,
      variables: this._variables,
      result: this._result,
      affectedQueries: this._affectedQueries,
      isActive: this.active,
      error: this.error,
      fetchPolicy: this.fetchPolicy,
      warning: undefined,
      duration: {
        totalTime: "NA",
        cacheWriteTime: this.getCacheWriteTime(),
        requestExecutionTime: "NA",
        cacheDiffTime: "NA",
        cacheBroadcastWatchesTime: "NA",
      },
      timing: this.timing,
    };
  }
}
