import {
  DataId,
  IDebugOperationDuration,
  IOperationResult,
  Not_Available,
  IVerboseOperation,
  OperationType,
  ITiming,
} from "./apollo-inspector.interface";
import { DocumentNode, print } from "graphql";
import { ErrorPolicy, OperationVariables } from "@apollo/client";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { RestrictedTimer } from "./restricted-timer";

export interface IDebugOperationConstructor {
  dataId: DataId;
  query: DocumentNode;
  variables: OperationVariables | undefined;
  operationId: number;
  debuggerEnabled: boolean;
  errorPolicy: ErrorPolicy;
  timer: RestrictedTimer;
}

export class IDebugOperation {
  protected _dataId: DataId;
  protected _result: IOperationResult[];
  protected _query: DocumentNode;
  protected _variables: OperationVariables | undefined;
  protected _affectedQueries: DocumentNode[];
  protected error?: unknown;
  protected active: boolean;
  protected _id: number;
  protected decimalNumber = 2;
  protected debuggerEnabled: boolean;
  protected errorPolicy: ErrorPolicy;
  protected timer: RestrictedTimer;
  protected timing: ITiming;
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
  }: IDebugOperationConstructor) {
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
    this._affectedQueries = [];

    this.serverQuery = undefined;
    this.clientQuery = undefined;

    this.debuggerEnabled = debuggerEnabled;
    this.errorPolicy = errorPolicy;
    const val = false;
    if (val) {
      console.log({
        errorPolicy: this.errorPolicy,
      });
    }
    this.timer = timer;
    this.timing = {
      queuedAt: "NA",
      dataWrittenToCacheCompletedAt: "NA",
      responseReceivedFromServerAt: "NA",
    };
    this.timing.queuedAt = this.timer.getCurrentMs();
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
      debugger;
    }
    this.error = error;
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

    return this.duration.totalExecutionTime || Not_Available;
  };

  protected getCacheWriteTime = () => {
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

    return this.duration.totalCacheWriteTime || Not_Available;
  };

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
      duration: undefined,
      timing: undefined,
    };
  }

  protected getOperationType() {
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
    }
    return OperationType.Unknown;
  }
}
