import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
  InternalOperationStatus,
  OperationStatus,
  DataId,
} from "../apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../../apollo-inspector-utils";
import { print } from "graphql";
import sizeOf from "object-sizeof";
import { NameNotFound } from "../apollo-inspector-debug-interfaces";

export interface ICientWriteFragmentOperationConstructor
  extends Omit<IBaseOperationConstructor, "dataId"> {
  fragmentName: string;
  dataId?: DataId;
}

export class ClientWriteFragmentOperation extends BaseOperation {
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];
  private fragmentName: string;

  constructor({
    dataId,
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    fragmentName,
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: ICientWriteFragmentOperationConstructor) {
    super({
      dataId: dataId || DataId.CLIENT_WRITE_FRAGMENT,
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

    this._operationStage = OperationStage.writeFragment;
    this._operationStages = [OperationStage.writeFragment];
    this.fragmentName = fragmentName;
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
    if (!this.isDirty && this.computedOperation) {
      return this.computedOperation;
    }
    const operationName = this.getOperationName();

    const operationString = print(this._query);

    const operation = {
      id: this._id,
      operationType: this.getOperationType(),
      operationName,
      operationString,
      clientId: this.clientId,
      variables: cloneDeep(this._variables),
      result: cloneDeep(this._result),
      affectedQueries: cloneDeep(this._affectedQueries),
      isActive: this.active,
      error: this.getError(),
      fetchPolicy: undefined,
      warning: undefined,
      relatedOperations: {
        parentOperationId: this.parentRelatedOperationId,
        childOperationIds: cloneDeep(this.relatedOperations),
      },
      duration: {
        totalTime: this.getTotalExecutionTime(),
        cacheWriteTime: this.getCacheWriteTime(),
        requestExecutionTime: "NA",
        cacheDiffTime: NaN,
        cacheBroadcastWatchesTime: NaN,
      },
      timing: cloneDeep(this.timing),
      status: this.getOperationStatus(),
      cacheSnapshot: this.cacheSnapshot,
      changeSetVersion: this.computeChangeSetVersion(),
    };

    this.isDirty = false;
    this.computedOperation = operation;
    return operation;
  }

  public setOperationStage(opStage: OperationStage) {
    this._operationStage = opStage;
    this._operationStages.push(opStage);
    if (opStage == OperationStage.addedDataToCache) {
      this.timing.dataWrittenToCacheCompletedAt = this.timer.getCurrentMs();
    }
  }

  public getOperationName(): string {
    return this.operationName === NameNotFound
      ? this.fragmentName
      : this.operationName;
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
