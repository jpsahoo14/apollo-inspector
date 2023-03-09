import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { getAffectedQueries } from "../../apollo-inspector-utils";
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
    async function override(...args: IMarkMutationResultArgs) {
      const [mutation, cache] = args;

      const { result } = mutation;
      const newResult = result as { operationId: number };
      const operationId = newResult.operationId;
      const promise = await originalMarkMutationResult.apply(this, args);
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const operation = opMap.get(operationId);
        if (operation) {
          const affectedQueries = getAffectedQueries(apolloClient);
          operation.addAffectedQueries(affectedQueries);
        }
      });

      return promise;
    };

  return () => {
    (apolloClient as unknown as IApolloClient).queryManager.markMutationResult =
      originalMarkMutationResult;
  };
};
