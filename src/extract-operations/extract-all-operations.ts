import { print } from "graphql";
import {
  IApolloOperation,
  IOperation,
  OperationType,
  DataId,
} from "../interfaces";
import { getOperationNameV2 } from "../apollo-inspector-utils";

export const extractAllOperationsData = (operations: {
  [key: number]: IApolloOperation;
}): IOperation[] => {
  const allOperations: IOperation[] = [];

  for (const key in operations) {
    if (operations.hasOwnProperty(key)) {
      const value: IApolloOperation = operations[key];
      const operation = getOperationWrapper(value);
      allOperations.push(operation);
    }
  }
  return allOperations;
};

const getOperation = ({
  data,
  operationType,
}: {
  data: IApolloOperation;
  operationType: OperationType;
}): IOperation => {
  const { query, result, variables, isActive, error } = data;

  const operationString = print(data.query);

  const operationName = getOperationNameV2(query);

  return {
    operationType,
    operationName,
    operationString,
    variables,
    result,
    isActive,
    error,
  };
};

const getOperationWrapper = (data: IApolloOperation): IOperation => {
  const { dataId, query, variables, result, error, isActive } = data;

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
        error,
        isActive,
      };
    }
  }
};
