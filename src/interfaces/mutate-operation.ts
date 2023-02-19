import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import {
  FetchPolicy,
  OperationVariables,
  MutationQueryReducersMap,
  InternalRefetchQueriesInclude,
  FetchResult,
  OnQueryUpdated,
  ErrorPolicy,
} from "@apollo/client";
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
import { MutationFetchPolicy } from "./apollo-client.interface";
import sizeOf from "object-sizeof";

export interface IMutationOperationConstructor
  extends IBaseOperationConstructor {
  fetchPolicy: MutationFetchPolicy;
  optimisticResponse: unknown | ((vars: OperationVariables) => unknown);
  updateQueries?: MutationQueryReducersMap<unknown>;
  refetchQueries?:
    | ((result: FetchResult<unknown>) => InternalRefetchQueriesInclude)
    | InternalRefetchQueriesInclude;
  awaitRefetchQueries?: boolean;
  onQueryUpdated?: OnQueryUpdated<any>;
}

export class MutationOperation extends BaseOperation {
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];
  private optimisticResponse: unknown | ((vars: OperationVariables) => unknown);
  private updateQueries?: MutationQueryReducersMap<unknown>;
  private refetchQueries?:
    | ((result: FetchResult<unknown>) => InternalRefetchQueriesInclude)
    | InternalRefetchQueriesInclude;
  private awaitRefetchQueries?: boolean;
  private onQueryUpdated?: OnQueryUpdated<any>;

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
    optimisticResponse,
    awaitRefetchQueries,
    onQueryUpdated,
    refetchQueries,
    updateQueries,
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
    this.optimisticResponse = optimisticResponse;
    this.awaitRefetchQueries = awaitRefetchQueries;
    this.onQueryUpdated = onQueryUpdated;
    this.refetchQueries = refetchQueries;
    this.updateQueries = updateQueries;
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
    this.addStatus(InternalOperationStatus.ResultFromNetworkSucceded);
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
    if (
      this.status.includes(InternalOperationStatus.ResultFromNetworkSucceded)
    ) {
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
