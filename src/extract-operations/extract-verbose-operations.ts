import { IVerboseOperation, IVerboseOperationMap } from "../interfaces";

export const extractVerboseOperationsData = (
  operations: IVerboseOperationMap
): IVerboseOperation[] => {
  const rawData = operations;
  const verboseOps: IVerboseOperation[] = [];
  for (const [_key, value] of rawData) {
    verboseOps.push(value.getOperationInfo());
  }
  verboseOps.sort((a, b) => a.id - b.id);

  return verboseOps;
};
