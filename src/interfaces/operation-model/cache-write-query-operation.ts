import { DataId } from "../apollo-inspector.interface";
import {
  ClientWriteQueryOperation,
  IClientWriteQueryOperationConstructor,
} from "./client-write-query-operation";

interface ICacheWriteQueryOperationConstructor
  extends IClientWriteQueryOperationConstructor {}

export class CacheWriteQueryOperation extends ClientWriteQueryOperation {
  constructor({
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    cacheSnapshotConfig,
  }: ICacheWriteQueryOperationConstructor) {
    super({
      dataId: DataId.CACHE_WRITE_QUERY,
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
