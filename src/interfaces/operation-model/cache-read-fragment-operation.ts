import { DataId } from "../apollo-inspector.interface";
import {
  ClientWriteFragmentOperation,
  ICientWriteFragmentOperationConstructor,
} from "./client-write-fragment-operation";

interface ICacheReadFragmentOperationConstructor
  extends Omit<ICientWriteFragmentOperationConstructor, "dataId"> {}

export class CacheReadFragmentOperation extends ClientWriteFragmentOperation {
  constructor({
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    fragmentName,
    cacheSnapshotConfig,
  }: ICacheReadFragmentOperationConstructor) {
    super({
      dataId: DataId.CACHE_READ_FRAGMENT,
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
