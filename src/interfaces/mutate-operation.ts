import { IDebugOperation, IDebugOperationConstructor } from "./debug-operation";
import { FetchPolicy } from "@apollo/client";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
} from "./apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { print } from "graphql";
import { MutationFetchPolicy } from "./apollo-client.interface";

export interface IMutationOperationConstructor
  extends IDebugOperationConstructor {
  fetchPolicy: MutationFetchPolicy;
}

export class MutationOperation extends IDebugOperation {
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];

  public fetchPolicy: MutationFetchPolicy;

  constructor({
    dataId,
    debuggerEnabled,
    errorPolicy,
    fetchPolicy,
    operationId,
    query,
    variables,
    timer,
  }: IMutationOperationConstructor) {
    super({
      dataId,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
    });

    this.fetchPolicy = fetchPolicy;
    this._operationStage = OperationStage.mutate;
    this._operationStages = [OperationStage.mutate];
  }

  public get operationStage() {
    return this._operationStage;
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
        totalTime: this.getTotalExecutionTime(),
        cacheWriteTime: this.getCacheWriteTime(),
        requestExecutionTime: "NA",
        cacheDiffTime: "NA",
        cacheBroadcastWatchesTime: "NA",
      },
      timing: this.timing,
    };
  }

  public setOperationStage(opStage: OperationStage) {
    this._operationStage = opStage;
    this._operationStages.push(opStage);
    if (opStage == OperationStage.addedDataToCache) {
      this.timing.dataWrittenToCacheCompletedAt = this.timer.getCurrentMs();
    }
  }
}
