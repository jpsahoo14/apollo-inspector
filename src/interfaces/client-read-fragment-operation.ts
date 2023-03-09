import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import {
  OperationStage,
  ResultsFrom,
  IVerboseOperation,
  InternalOperationStatus,
  OperationStatus,
  DataId,
} from "./apollo-inspector.interface";
import { cloneDeep } from "lodash-es";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { print } from "graphql";
import sizeOf from "object-sizeof";
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
    });
  }
}
