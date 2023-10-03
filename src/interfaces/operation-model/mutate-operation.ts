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
  DataId,
} from "../apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../../apollo-inspector-utils";
import { DocumentNode, print } from "graphql";
import { MutationFetchPolicy } from "../apollo-client.interface";
import sizeOf from "object-sizeof";

export interface IMutationOperationConstructor
  extends Omit<IBaseOperationConstructor, "dataId"> {
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
  private static Update_Operations = "Update_Operations";
  private _operationStage: OperationStage;
  private _operationStages: OperationStage[];
  private optimisticResponse: unknown | ((vars: OperationVariables) => unknown);
  private updateQueries?: MutationQueryReducersMap<unknown>;
  private refetchQueries?:
    | ((result: FetchResult<unknown>) => InternalRefetchQueriesInclude)
    | InternalRefetchQueriesInclude;
  private awaitRefetchQueries?: boolean;
  private onQueryUpdated?: OnQueryUpdated<any>;
  private relatedOperationsMap: Map<string, number[]>;
  private affectedWatchQueriesDueToOptimisticResponse: DocumentNode[];
  public isRunningOptimisticPhase: boolean;

  public fetchPolicy: MutationFetchPolicy;

  constructor({
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
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: IMutationOperationConstructor) {
    super({
      dataId: DataId.ROOT_MUTATION,
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

    this.fetchPolicy = fetchPolicy;
    this._operationStage = OperationStage.mutate;
    this._operationStages = [OperationStage.mutate];
    this.optimisticResponse = optimisticResponse;
    this.awaitRefetchQueries = awaitRefetchQueries;
    this.onQueryUpdated = onQueryUpdated;
    this.refetchQueries = refetchQueries;
    this.updateQueries = updateQueries;
    this.isRunningOptimisticPhase = false;
    this.relatedOperationsMap = new Map();
    this.affectedWatchQueriesDueToOptimisticResponse = [];

    optimisticResponse &&
      this._result.push({
        from: ResultsFrom.OPTIMISTIC_RESPONSE,
        result: optimisticResponse,
        size: sizeOf(optimisticResponse),
      });
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
    if (!this.isDirty && this.computedOperation) {
      return this.computedOperation;
    }
    const operationName = getOperationNameV2(this._query);
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
      affectedQueriesDueToOptimisticResponse: cloneDeep(
        this.affectedWatchQueriesDueToOptimisticResponse
      ),
      isActive: this.active,
      error: this.getError(),
      fetchPolicy: this.fetchPolicy,
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
      cacheSnapshot: cloneDeep(this.cacheSnapshot),
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

  public addAffectedQueriesDueToOptimisticResponse(
    queries: DocumentNode[]
  ): void {
    this.affectedWatchQueriesDueToOptimisticResponse =
      this.affectedWatchQueriesDueToOptimisticResponse.concat(queries);
  }

  public addOperationsCalledFromUpdateCallback(operationId: number) {
    const operations = this.relatedOperationsMap.get(
      MutationOperation.Update_Operations
    );
    if (operations) {
      operations.push(operationId);
    } else {
      const operations = [operationId];
      this.relatedOperationsMap.set(
        MutationOperation.Update_Operations,
        operations
      );
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

    if (this.status.includes(InternalOperationStatus.InFlight)) {
      return OperationStatus.InFlight;
    }
    return OperationStatus.Unknown;
  }
}
