import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
  InternalOperationStatus,
  OperationStatus,
} from "./apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { print } from "graphql";
import sizeOf from "object-sizeof";

export interface IWriteQueryOperationConstructor
  extends IBaseOperationConstructor {}

export class WriteQueryOperation extends BaseOperation {
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];

  constructor({
    dataId,
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
  }: IWriteQueryOperationConstructor) {
    super({
      dataId,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
    });

    this._operationStage = OperationStage.writeQuery;
    this._operationStages = [OperationStage.writeQuery];
  }

  public get operationStage() {
    return this._operationStage;
  }

  public addResult(result: unknown) {
    const clonedResult = cloneDeep(result);
    this._result.push({
      from: ResultsFrom.NETWORK,
      result: clonedResult,
      size: sizeOf(clonedResult),
    });
    this.addStatus(InternalOperationStatus.ResultFromCacheSucceded);
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
      fetchPolicy: undefined,
      warning: undefined,
      duration: {
        totalTime: this.getTotalExecutionTime(),
        cacheWriteTime: this.getCacheWriteTime(),
        requestExecutionTime: "NA",
        cacheDiffTime: "NA",
        cacheBroadcastWatchesTime: "NA",
      },
      timing: this.timing,
      status: this.getOperationStatus(),
    };
  }

  public setOperationStage(opStage: OperationStage) {
    this._operationStage = opStage;
    this._operationStages.push(opStage);
    if (opStage == OperationStage.addedDataToCache) {
      this.timing.dataWrittenToCacheCompletedAt = this.timer.getCurrentMs();
    }
  }

  protected getOperationStatus() {
    if (this.status.includes(InternalOperationStatus.ResultFromCacheSucceded)) {
      return OperationStatus.Succeded;
    }

    if (
      this.status.includes(InternalOperationStatus.FailedToGetResultFromNetwork)
    ) {
      return OperationStatus.Failed;
    }
    return OperationStatus.Unknown;
  }
}
