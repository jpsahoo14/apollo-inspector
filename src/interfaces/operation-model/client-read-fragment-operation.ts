import { DataId } from "../apollo-inspector.interface";
import {
  ClientWriteFragmentOperation,
  ICientWriteFragmentOperationConstructor,
} from "./client-write-fragment-operation";

export interface IClientReadFragmentOperationConstructor
  extends ICientWriteFragmentOperationConstructor {}

export class ClientReadFragmentOperation extends ClientWriteFragmentOperation {
  constructor({
    dataId,
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    fragmentName,
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: ICientWriteFragmentOperationConstructor) {
    super({
      dataId: DataId.CLIENT_READ_FRAGMENT,
      debuggerEnabled,
      errorPolicy,
      operationId,
      query,
      variables,
      timer,
      fragmentName,
      cacheSnapshotConfig,
      parentRelatedOperationId,
      clientId,
    });
  }
}
