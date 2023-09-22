import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
  InternalOperationStatus,
  OperationStatus,
  DataId,
} from "../apollo-inspector.interface";
import { IDiff } from "../apollo-client.interface";
import { print } from "graphql";
import { WatchQueryFetchPolicy } from "@apollo/client";
import { getOperationNameV2 } from "../../apollo-inspector-utils";
import { cloneDeep } from "lodash-es";
import sizeOf from "object-sizeof";

export interface IQueryOperationConstructor
  extends Omit<IBaseOperationConstructor, "dataId"> {
  queryInfo: unknown;
  fetchPolicy: WatchQueryFetchPolicy | "no-cache" | undefined;
}

export class QueryOperation extends BaseOperation {
  private queryInfo: unknown;
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];

  public deduplication: boolean;
  public diff: IDiff | undefined;
  public piggyBackOnExistingObservable: boolean;
  public fetchPolicy: WatchQueryFetchPolicy | "no-cache" | undefined;

  constructor({
    debuggerEnabled,
    errorPolicy,
    fetchPolicy,
    operationId,
    query,
    queryInfo,
    variables,
    timer,
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: IQueryOperationConstructor) {
    super({
      dataId: DataId.ROOT_QUERY,
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

    this.queryInfo = queryInfo;
    this.fetchPolicy = fetchPolicy;
    this._operationStage = OperationStage.fetchQueryObservable;
    this._operationStages = [OperationStage.fetchQueryObservable];
    this.deduplication = true;
    this.piggyBackOnExistingObservable = false;
    const val = false;
    if (val) {
      console.log({
        queryInfo: this.queryInfo,
      });
    }
  }

  public get operationStage() {
    return this._operationStage;
  }

  public addResult(result: unknown) {
    const clonedResult = cloneDeep(result);
    switch (this.fetchPolicy) {
      case "cache-first": {
        if (this.diff?.complete) {
          this._result.push({
            from: ResultsFrom.CACHE,
            result: clonedResult,
            size: sizeOf(clonedResult),
          });
          this.addStatus(InternalOperationStatus.ResultFromCacheSucceded);
        } else {
          this._result.push({
            from: ResultsFrom.NETWORK,
            result: clonedResult,
            size: sizeOf(clonedResult),
          });
          this.addStatus(InternalOperationStatus.ResultFromNetworkSucceded);
        }
        return;
      }
      case "cache-and-network": {
        if (this.result.length === 0 && this.diff?.complete) {
          this._result.push({
            from: ResultsFrom.CACHE,
            result: clonedResult,
            size: sizeOf(clonedResult),
          });
          this.addStatus(InternalOperationStatus.ResultFromCacheSucceded);
        } else {
          this._result.push({
            from: ResultsFrom.NETWORK,
            result: clonedResult,
            size: sizeOf(clonedResult),
          });
          this.addStatus(InternalOperationStatus.ResultFromNetworkSucceded);
        }
        return;
      }
      case "cache-only": {
        this._result.push({
          from: ResultsFrom.CACHE,
          result: clonedResult,
          size: sizeOf(clonedResult),
        });
        this.addStatus(InternalOperationStatus.ResultFromCacheSucceded);
        return;
      }
      case "network-only":
      case "no-cache": {
        this._result.push({
          from: ResultsFrom.NETWORK,
          result: clonedResult,
          size: sizeOf(clonedResult),
        });
        this.addStatus(InternalOperationStatus.ResultFromNetworkSucceded);
        return;
      }
    }

    debugger;
    this._result.push({
      from: ResultsFrom.UNKNOWN,
      result: clonedResult,
      size: sizeOf(clonedResult),
    });
  }

  public setOperationStage(opStage: OperationStage) {
    switch (opStage) {
      case OperationStage.fetchQueryObservable:
        break;
      case OperationStage.linkExecutionStart:
        {
          this.doesOperationExist(OperationStage.fetchQueryObservable);
        }
        break;
      case OperationStage.linkNextExecution:
        {
          this.doesOperationExist(OperationStage.fetchQueryObservable);
          this.doesOperationExist(OperationStage.linkExecutionStart);

          if (this._operationStage !== OperationStage.linkExecutionStart) {
            debugger;
          }
        }
        break;
      case OperationStage.markResultExecution:
        {
          this.doesOperationExist(OperationStage.fetchQueryObservable);
          this.doesOperationExist(OperationStage.linkExecutionStart);
          this.doesOperationExist(OperationStage.linkNextExecution);
        }
        break;
      case OperationStage.addedDataToCache:
        {
          if (opStage == OperationStage.addedDataToCache) {
            this.timing.dataWrittenToCacheCompletedAt =
              this.timer.getCurrentMs();
          }

          this.doesOperationExist(OperationStage.fetchQueryObservable);
          this.doesOperationExist(OperationStage.linkExecutionStart);
          this.doesOperationExist(OperationStage.linkNextExecution);
          this.doesOperationExist(OperationStage.markResultExecution);
        }
        break;
      case OperationStage.linkCompleteExecution:
        {
          this.doesOperationExist(OperationStage.fetchQueryObservable);
          this.doesOperationExist(OperationStage.linkExecutionStart);
          this.doesOperationExist(OperationStage.linkNextExecution);
          this.doesOperationExist(OperationStage.markResultExecution);
          this.fetchPolicy !== "no-cache" &&
            this.doesOperationExist(OperationStage.addedDataToCache);
        }
        break;
    }
    this.debuggerEnabled &&
      console.log(`APD operationId:${this._id} operationStage: ${opStage}`);
    this._operationStage = opStage;
    this._operationStages.push(opStage);
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
      variables: cloneDeep(this._variables),
      result: cloneDeep(this._result),
      affectedQueries: cloneDeep(this._affectedQueries),
      isActive: this.active,
      error: this.error,
      fetchPolicy: this.fetchPolicy,
      warning: this.getWarning(),
      relatedOperations: {
        parentOperationId: this.parentRelatedOperationId,
        childOperationIds: cloneDeep(this.relatedOperations),
      },
      duration: {
        totalTime: this.getTotalExecutionTime(),
        cacheWriteTime: this.getCacheWriteTime(),
        requestExecutionTime: this.getResolverTime(),
        cacheDiffTime: this.getCacheDiffTime(),
        cacheBroadcastWatchesTime: this.getCacheBroadcastWatchesTime(),
      },
      timing: cloneDeep(this.timing),
      status: this.getOperationStatus(),
      cacheSnapshot: this.cacheSnapshot,
    };
  }

  protected getOperationStatus() {
    if (this.status.length === 1) {
      return OperationStatus.InFlight;
    }

    switch (this.fetchPolicy) {
      case "cache-first": {
        if (this.hasCacheFirstOperationSucceded()) {
          return OperationStatus.Succeded;
        }
      }
      case "cache-and-network": {
        if (this.hasCacheAndNetWorkOperationSucceded()) {
          return OperationStatus.Succeded;
        }

        if (
          this.hasCacheAndNetworkOperationFailedToGetResultsFromNetworkOnly()
        ) {
          return OperationStatus.PartialSuccess;
        }

        return OperationStatus.Failed;
      }

      case "cache-only": {
        if (this.hasCacheOnlyOperationSucceded()) {
          return OperationStatus.Succeded;
        }

        return OperationStatus.Failed;
      }

      case "network-only":
      case "no-cache": {
        if (this.hasNetworkOnlyOperationSucceded()) {
          return OperationStatus.Succeded;
        }

        return OperationStatus.Failed;
      }

      default: {
        return OperationStatus.Unknown;
      }
    }
  }

  private hasNetworkOnlyOperationSucceded() {
    return this.status.includes(
      InternalOperationStatus.ResultFromNetworkSucceded
    );
  }

  private hasCacheOnlyOperationSucceded() {
    return this.status.includes(
      InternalOperationStatus.ResultFromCacheSucceded
    );
  }

  private hasCacheAndNetworkOperationFailedToGetResultsFromNetworkOnly() {
    return (
      this.status.includes(InternalOperationStatus.ResultFromCacheSucceded) &&
      this.status.includes(InternalOperationStatus.FailedToGetResultFromNetwork)
    );
  }

  private hasCacheAndNetWorkOperationSucceded() {
    return (
      (this.status.includes(InternalOperationStatus.ResultFromCacheSucceded) &&
        this.status.includes(
          InternalOperationStatus.ResultFromNetworkSucceded
        )) ||
      this.status.includes(InternalOperationStatus.ResultFromNetworkSucceded)
    );
  }

  private hasCacheFirstOperationSucceded() {
    return (
      this.status.includes(InternalOperationStatus.ResultFromCacheSucceded) ||
      this.status.includes(InternalOperationStatus.ResultFromNetworkSucceded)
    );
  }

  private doesOperationExist(opStage: OperationStage) {
    const result = this._operationStages.find((op) => op === opStage);
    if (result === undefined) {
      // debugger;
      return false;
    }

    return true;
  }

  private getWarning() {
    if (this.diff && !this.diff.complete && this.diff.missing) {
      const msgs: unknown[] = [];
      this.diff.missing.forEach((m) => {
        msgs.push({ message: m.message, path: m.path });
      });

      return msgs;
    }

    return undefined;
  }

  private getResolverTime = () => {
    if (
      !this.duration.totalResovlerTime &&
      this.duration.linkNextExecutionTime?.length > 0
    ) {
      if (this.duration.linkEnterTime) {
        const value =
          this.duration.linkNextExecutionTime[0] - this.duration.linkEnterTime;
        if (!isNaN(value)) {
          this.duration.totalResovlerTime = parseFloat(
            value.toFixed(this.decimalNumber)
          );
        }
      }
    }

    return (
      this.duration.totalResovlerTime ||
      (this.piggyBackOnExistingObservable ? "Multiplexed" : NaN)
    );
  };

  private getCacheDiffTime = () => {
    if (!this.duration.totalCacheDiffTime) {
      if (this.duration.cacheDiffEnd && this.duration.cacheDiffStart) {
        const value = this.duration.cacheDiffEnd - this.duration.cacheDiffStart;
        if (!isNaN(value)) {
          this.duration.totalCacheDiffTime = parseFloat(
            value.toFixed(this.decimalNumber)
          );
        }
      }
    }

    return this.duration.totalCacheDiffTime || NaN;
  };

  private getCacheBroadcastWatchesTime = () => {
    if (!this.duration.totalCacheBroadcastWatchesTime) {
      if (
        this.duration.cacheBroadcastWatchesEnd &&
        this.duration.cacheBroadcastWatchesStart
      ) {
        const value =
          this.duration.cacheBroadcastWatchesEnd -
          this.duration.cacheBroadcastWatchesStart;
        if (!isNaN(value)) {
          this.duration.totalCacheBroadcastWatchesTime = parseFloat(
            value.toFixed(this.decimalNumber)
          );
        }
      }
    }

    return this.duration.totalCacheBroadcastWatchesTime || NaN;
  };
}
