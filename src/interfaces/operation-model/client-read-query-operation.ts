import { DataId } from "../apollo-inspector.interface";
import {
  ClientWriteQueryOperation,
  IClientWriteQueryOperationConstructor,
} from "./client-write-query-operation";

interface IClientReadQueryOperation
  extends IClientWriteQueryOperationConstructor {}

export class ClientReadQueryOperation extends ClientWriteQueryOperation {
  constructor({
    debuggerEnabled,
    errorPolicy,
    operationId,
    query,
    variables,
    timer,
    cacheSnapshotConfig,
    parentRelatedOperationId,
    clientId,
  }: IClientReadQueryOperation) {
    super({
      dataId: DataId.CLIENT_READ_QUERY,
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
  }
}
