import {
  DataId,
  IDebugOperationDuration,
  IOperationResult,
  IVerboseOperation,
  OperationType,
  ITiming,
  OperationStatus,
  InternalOperationStatus,
  ICacheSnapshotAfterOperationConfig,
} from "../apollo-inspector.interface";
import { DocumentNode, print } from "graphql";
import { ErrorPolicy, OperationVariables } from "@apollo/client";
import { getOperationNameV2 } from "../../apollo-inspector-utils";
import { RestrictedTimer } from "../restricted-timer";
import { IBaseOperation } from "../base-operation.interface";
import { cloneDeep } from "lodash-es";
import { isOperationNameInList } from "./operations-util";

export interface IBaseOperationConstructor {
  dataId: DataId;
  query: DocumentNode;
  variables: OperationVariables | undefined;
  operationId: number;
  debuggerEnabled: boolean;
  errorPolicy: ErrorPolicy | undefined;
  timer: RestrictedTimer;
  cacheSnapshotConfig?: ICacheSnapshotAfterOperationConfig;
  parentRelatedOperationId: number;
  clientId: string;
}

export class BaseOperation implements IBaseOperation {
  protected _dataId: DataId;
  protected _result: IOperationResult[];
  protected _query: DocumentNode;
  protected _variables: OperationVariables | undefined;
  protected _affectedQueries: DocumentNode[];
  protected error?: unknown;
  protected active: boolean;
  protected _id: number;
  protected decimalNumber = 2;
  protected _isDirty: boolean;
  protected computedOperation: IVerboseOperation | null;
  protected debuggerEnabled: boolean;
  protected errorPolicy: ErrorPolicy | undefined;
  protected timer: RestrictedTimer;
  protected status: InternalOperationStatus[];
  protected timing: ITiming;
  protected cacheSnapshot: any;
  protected cacheSnapShotConfig: ICacheSnapshotAfterOperationConfig | null;
  protected operationName: string;
  protected relatedOperations: number[];
  protected parentRelatedOperationId: number = 0;
  protected clientId: string;
  protected changeSetVersion: number;
  public duration: IDebugOperationDuration;
  public serverQuery: DocumentNode | undefined;
  public clientQuery: DocumentNode | undefined;

  constructor({
    dataId,
    query,
    variables,
    operationId,
    debuggerEnabled,
    errorPolicy,
    timer,
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: IBaseOperationConstructor) {
    if (operationId === 0) {
      debugger;
    }
    this._dataId = dataId;
    this._result = [];
    this.active = true;
    this.duration = {
      linkNextExecutionTime: [],
      operationExecutionStartTime: performance.now(),
    };
    this._query = query;
    this._variables = variables;
    this._id = operationId;
    this.clientId = clientId;
    this._affectedQueries = [];
    this.operationName = getOperationNameV2(query);
    this.serverQuery = undefined;
    this.clientQuery = undefined;

    this._isDirty = true;
    this.computedOperation = null;
    this.debuggerEnabled = debuggerEnabled;
    this.cacheSnapShotConfig = cacheSnapshotConfig || null;
    this.errorPolicy = errorPolicy;
    this.relatedOperations = [];
    this.changeSetVersion = 0;
    this.parentRelatedOperationId = parentRelatedOperationId;
    const val = false;
    if (val) {
      console.log({
        errorPolicy: this.errorPolicy,
      });
    }
    this.timer = timer;
    this.timing = {
      queuedAt: NaN,
      dataWrittenToCacheCompletedAt: NaN,
      responseReceivedFromServerAt: NaN,
    };
    this.timing.queuedAt = this.timer.getCurrentMs();
    this.status = [];
    this.status.push(InternalOperationStatus.InFlight);
  }

  public addResult(result: unknown): void {
    throw new Error("Method not implemented.");
  }

  public get affectedQueries() {
    return this._affectedQueries;
  }

  public get query() {
    return this._query;
  }
  public get variables() {
    return this._variables;
  }
  public get id() {
    return this._id;
  }
  public get dataId() {
    return this._dataId;
  }

  public get result() {
    return this._result;
  }

  public addError(error: unknown) {
    if (this.error) {
      if (this.debuggerEnabled) {
        debugger;
      }
    }
    this.error = error || null;
    this.error &&
      this.addStatus(InternalOperationStatus.FailedToGetResultFromNetwork);
  }

  public setInActive() {
    this.active = false;
  }

  public addAffectedQueries(queries: DocumentNode[]) {
    this._affectedQueries = this._affectedQueries.concat(queries);
  }

  public getTotalExecutionTime = () => {
    if (!this.duration.totalExecutionTime) {
      if (
        this.duration.operationExecutionEndTime &&
        this.duration.operationExecutionStartTime
      ) {
        const value =
          this.duration.operationExecutionEndTime -
          this.duration.operationExecutionStartTime;
        if (!isNaN(value)) {
          this.duration.totalExecutionTime = parseFloat(
            value.toFixed(this.decimalNumber)
          );
        }
      }
    }

    return this.duration.totalExecutionTime || NaN;
  };

  public addRelatedOperation(operationId: number) {
    this.relatedOperations.push(operationId);
  }

  public getCacheWriteTime = (): number => {
    if (!this.duration.totalCacheWriteTime) {
      if (this.duration.cacheWriteEnd && this.duration.cacheWriteStart) {
        const value =
          this.duration.cacheWriteEnd - this.duration.cacheWriteStart;
        if (!isNaN(value)) {
          this.duration.totalCacheWriteTime = parseFloat(
            value.toFixed(this.decimalNumber)
          );
        }
      }
    }

    return this.duration.totalCacheWriteTime || NaN;
  };

  public getOperationInfo(): Readonly<IVerboseOperation> {
    if (!this._isDirty && this.computedOperation) {
      return this.computedOperation;
    }
    const operationName = getOperationNameV2(this._query);
    const operationString = print(this._query);

    const operation = {
      id: this._id,
      operationType: this.getOperationType(),
      operationName,
      clientId: this.clientId,
      operationString,
      variables: cloneDeep(this._variables),
      result: cloneDeep(this._result),
      affectedQueries: cloneDeep(this._affectedQueries),
      isActive: this.active,
      error: this.getError(),
      fetchPolicy: undefined,
      relatedOperations: {
        parentOperationId: this.parentRelatedOperationId,
        childOperationIds: cloneDeep(this.relatedOperations),
      },
      warning: undefined,
      duration: undefined,
      timing: undefined,
      status: this.getOperationStatus(),
      cacheSnapshot: this.cacheSnapshot,
      changeSetVersion: this.computeChangeSetVersion(),
    };

    this._isDirty = false;
    this.computedOperation = operation;
    return operation;
  }

  public getOperationType() {
    switch (this._dataId) {
      case DataId.ROOT_QUERY: {
        return OperationType.Query;
      }
      case DataId.ROOT_MUTATION: {
        return OperationType.Mutation;
      }
      case DataId.ROOT_SUBSCRIPTION: {
        return OperationType.Subscription;
      }
      case DataId.CLIENT_WRITE_QUERY: {
        return OperationType.ClientWriteQuery;
      }
      case DataId.CLIENT_WRITE_FRAGMENT: {
        return OperationType.ClientWriteFragment;
      }
      case DataId.CACHE_WRITE_QUERY: {
        return OperationType.CacheWriteQuery;
      }
      case DataId.CACHE_WRITE_FRAGMENT: {
        return OperationType.CacheWriteFragment;
      }

      case DataId.CLIENT_READ_QUERY: {
        return OperationType.ClientReadQuery;
      }
      case DataId.CLIENT_READ_FRAGMENT: {
        return OperationType.ClientReadFragment;
      }
      case DataId.CACHE_READ_QUERY: {
        return OperationType.CacheReadQuery;
      }
      case DataId.CACHE_READ_FRAGMENT: {
        return OperationType.CacheReadFragment;
      }
    }
    return OperationType.Unknown;
  }

  public addTimingInfo(key: keyof ITiming): void {
    this.timing[key] = this.timer.getCurrentMs();
  }

  public addStatus(status: InternalOperationStatus) {
    this.status.push(status);
  }

  public markDirty(): void {
    this._isDirty = true;
  }

  public setCacheSnapshot(cache: unknown) {
    if (
      this.cacheSnapShotConfig?.enabled &&
      isOperationNameInList(
        this.getOperationName(),
        this.cacheSnapShotConfig.operationsName
      )
    ) {
      const startTime = performance.now();
      this.cacheSnapshot = cloneDeep(cache);
      const endTime = performance.now();
      console.log({ cloneDeepTime: `${endTime - startTime}` });
    }
  }

  public get isDirty() {
    return this._isDirty;
  }

  public getOperationName(): string {
    return this.operationName;
  }

  protected getOperationStatus() {
    return OperationStatus.Unknown;
  }
  protected getError() {
    try {
      if (this.error) {
        const value = JSON.parse(JSON.stringify(this.error));
        return value;
      }
      return null;
    } catch {}
  }

  protected computeChangeSetVersion() {
    this.changeSetVersion = this.changeSetVersion + 1;
    return this.changeSetVersion;
  }
}
