import { DataId } from "../apollo-inspector.interface";
import {
  ClientWriteQueryOperation,
  IClientWriteQueryOperationConstructor,
} from "./client-write-query-operation";

interface ICacheReadQueryOperationConstructor
  extends IClientWriteQueryOperationConstructor {}

export class CacheReadQueryOperation extends ClientWriteQueryOperation {
  constructor({
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    cacheSnapshotConfig,
  }: ICacheReadQueryOperationConstructor) {
    super({
      dataId: DataId.CACHE_READ_QUERY,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
      cacheSnapshotConfig,
    });
  }
}
