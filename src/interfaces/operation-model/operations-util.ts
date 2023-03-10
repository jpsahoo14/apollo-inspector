import { random } from "lodash-es";
import { IApolloInspectorState } from "../apollo-inspector-debug-interfaces";
import { RestrictedTimer } from "../restricted-timer";
import { IBaseOperationConstructor } from "./base-operation";

export interface IGetBaseOperationConstructorExtraParams {
  rawData: IApolloInspectorState;
}
export const getBaseOperationConstructorExtraParams = (
  params: IGetBaseOperationConstructorExtraParams
): Pick<IBaseOperationConstructor, "timer" | "cacheSnapshotConfig"> => {
  const { rawData } = params;
  return {
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
  const found = names.filter(
    (name) =>
      name.toLocaleLowerCase().trim() ===
      operationName.toLocaleLowerCase().trim()
  );

  if (!found) {
    return false;
  }

  return true;
};
