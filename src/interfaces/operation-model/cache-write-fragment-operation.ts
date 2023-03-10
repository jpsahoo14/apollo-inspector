import { DataId } from "../apollo-inspector.interface";
import {
  ClientWriteFragmentOperation,
  ICientWriteFragmentOperationConstructor,
} from "./client-write-fragment-operation";

export interface ICacheWriteFragmentOperation
  extends Omit<ICientWriteFragmentOperationConstructor, "dataId"> {}

export class CacheWriteFragmentOperation extends ClientWriteFragmentOperation {
  constructor({
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    fragmentName,
    cacheSnapshotConfig,
  }: ICacheWriteFragmentOperation) {
    super({
      dataId: DataId.CACHE_WRITE_FRAGMENT,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
      fragmentName,
      cacheSnapshotConfig,
    });
  }
}
