import {
  IApolloOperation,
  OperationType,
  IOperation,
  DataId,
} from "../interfaces";
import { getOperationNameV2 } from "../apollo-inspector-utils";
import { print } from "graphql";

export const extractCacheOperations = (cacheOperations: IApolloOperation[]) => {
  const operations: IOperation[] = cacheOperations.map(
    (data: IApolloOperation) => {
      const { dataId, query, variables, result } = data;

      switch (dataId) {
        case DataId.ROOT_QUERY: {
          return getOperation({ data, operationType: OperationType.Query });
        }
        case DataId.ROOT_MUTATION: {
          return getOperation({ data, operationType: OperationType.Mutation });
        }
        case DataId.ROOT_SUBSCRIPTION: {
          return getOperation({
            data,
            operationType: OperationType.Subscription,
          });
        }
        case DataId.ROOT_OPTIMISTIC_MUTATION: {
          return getOperation({
            data,
            operationType: OperationType.Mutation,
          });
        }
        default: {
          const operationName = dataId;
          const operationString = print(query);
          const operationType = OperationType.Unknown;

          return {
            operationType,
            operationName,
            operationString,
            variables,
            result,
          };
        }
      }
    }
  );

  return operations;
};

const getOperation = ({
  data,
  operationType,
}: {
  data: IApolloOperation;
  operationType: OperationType;
}): IOperation => {
  const { query, result, variables } = data;

  const operationString = print(data.query);

  const operationName = getOperationNameV2(query);

  return {
    operationType,
    operationName,
    operationString,
    variables,
    result,
  };
};
