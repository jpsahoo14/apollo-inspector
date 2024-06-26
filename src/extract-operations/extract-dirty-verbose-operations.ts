import {
  IVerboseOperation,
  IVerboseOperationMap,
  IInspectorTrackingConfig,
} from "../interfaces";

export const extractDirtyVerboseOperationsData = (
  operations: IVerboseOperationMap,
  config: IInspectorTrackingConfig
): IVerboseOperation[] => {
  const rawData = operations;
  const verboseOps: IVerboseOperation[] = [];
  for (const [_key, value] of rawData) {
    if (value.isDirty) {
      let operationInfo = value.getOperationInfo();
      config.hooks?.forEach((hook) => {
        operationInfo = hook.transform(operationInfo);
      });
      verboseOps.push(operationInfo);
    }
  }
  verboseOps.sort((a, b) => a.id - b.id);

  return verboseOps;
};
