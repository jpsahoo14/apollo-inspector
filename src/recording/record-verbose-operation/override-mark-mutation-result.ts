import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  IApolloClient,
  QueryOperation,
  IMarkMutationResultArgs,
  IVerboseOperationMap,
} from "../../interfaces";

export const overrideMarkMutationResult = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
) => {
  const originalMarkMutationResult = (apolloClient as unknown as IApolloClient)
    .queryManager.markMutationResult;

  (apolloClient as unknown as IApolloClient).queryManager.markMutationResult =
    function override(...args: IMarkMutationResultArgs) {
      const [mutation, cache] = args;

      const { result } = mutation;
      const newResult = result as { operationId: number };
      const operationId = newResult.operationId;
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId) as QueryOperation | undefined;
        if (op) {
          op.addResult(result);
          ``;
        }
      });

      const promise = originalMarkMutationResult.apply(this, args);
      return promise;
    };

  return () => {
    (apolloClient as unknown as IApolloClient).queryManager.markMutationResult =
      originalMarkMutationResult;
  };
};
