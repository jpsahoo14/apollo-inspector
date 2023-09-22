import { WatchQueryFetchPolicy } from "@apollo/client";
import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import { IDiff } from "../apollo-client.interface";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
  OperationStatus,
  DataId,
} from "../apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../../apollo-inspector-utils";
import { print } from "graphql";
import sizeOf from "object-sizeof";

export interface ISubscriptionOperationConstructor
  extends Omit<IBaseOperationConstructor, "dataId"> {}

export class SubscriptionOperation extends BaseOperation {
  private _operationStages: OperationStage[];
  private _operationStage: OperationStage;

  public deduplication: boolean;
  public diff: IDiff | undefined;
  public piggyBackOnExistingObservable: boolean;
  public fetchPolicy: WatchQueryFetchPolicy | "no-cache" | undefined;

  constructor({
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: ISubscriptionOperationConstructor) {
    super({
      dataId: DataId.ROOT_SUBSCRIPTION,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
      cacheSnapshotConfig,
      parentRelatedOperationId,
      clientId,
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
    this._result.push({
      from: ResultsFrom.NETWORK,
      result: clonedResult,
      size: sizeOf(clonedResult),
    });
  }

  public getOperationInfo(): IVerboseOperation {
    const operationName = getOperationNameV2(this._query);
    const operationString = print(this._query);

    return {
      id: this._id,
      operationType: this.getOperationType(),
      operationName,
      operationString,
      clientId: this.clientId,
      variables: this._variables,
      result: cloneDeep(this._result),
      affectedQueries: cloneDeep(this._affectedQueries),
      isActive: this.active,
      error: this.error,
      fetchPolicy: this.fetchPolicy,
      warning: undefined,
      relatedOperations: {
        parentOperationId: this.parentRelatedOperationId,
        childOperationIds: cloneDeep(this.relatedOperations),
      },
      duration: {
        totalTime: NaN,
        cacheWriteTime: this.getCacheWriteTime(),
        requestExecutionTime: NaN,
        cacheDiffTime: NaN,
        cacheBroadcastWatchesTime: NaN,
      },
      timing: cloneDeep(this.timing),
      status: OperationStatus.Succeded,
      cacheSnapshot: this.cacheSnapshot,
    };
  }
}
