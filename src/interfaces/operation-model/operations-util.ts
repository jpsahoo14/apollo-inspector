import { random } from "lodash-es";
import { IApolloInspectorState } from "../apollo-inspector-debug-interfaces";
import { RestrictedTimer } from "../restricted-timer";
import { BaseOperation, IBaseOperationConstructor } from "./base-operation";
import { MutationOperation } from "./mutate-operation";
import { QueryOperation } from "./query-operation";
import { SubscriptionOperation } from "./subscription-operation";
import { DataId, IApolloClientObject } from "../apollo-inspector.interface";

export interface IGetBaseOperationConstructorExtraParams {
  rawData: IApolloInspectorState;
}
export const getBaseOperationConstructorExtraParams = (
  params: IGetBaseOperationConstructorExtraParams,
  clientObj: IApolloClientObject
): Pick<
  IBaseOperationConstructor,
  "timer" | "cacheSnapshotConfig" | "parentRelatedOperationId" | "clientId"
> => {
  const { rawData } = params;
  return {
    clientId: clientObj.cliendId,
    parentRelatedOperationId: rawData.currentOperationId,
    timer: new RestrictedTimer(rawData.timer),
    cacheSnapshotConfig:
      typeof rawData.config.tracking.trackVerboseOperations === "object"
        ? rawData.config.tracking.trackVerboseOperations
            .cacheSnapshotAfterOperation
        : undefined,
  };
};

export const isOperationNameInList = (
  operationName: string,
  names: string[]
) => {
  const found = names.find(
    (name) =>
      name.toLocaleLowerCase().trim() ===
      operationName.toLocaleLowerCase().trim()
  );

  if (!found) {
    return false;
  }

  return true;
};

export const addRelatedOperations = (
  operation: BaseOperation | QueryOperation | undefined | MutationOperation,
  relatedOperationId: number
) => {
  const dataId = operation?.dataId;

  switch (dataId) {
    case DataId.ROOT_MUTATION: {
      (operation as MutationOperation).addOperationsCalledFromUpdateCallback(
        relatedOperationId
      );
    }

    default: {
      operation?.addRelatedOperation(relatedOperationId);
    }
  }
};
