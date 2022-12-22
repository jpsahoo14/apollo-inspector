import {
  DataId,
  ISetAllApolloOperations,
  IAllOperations,
  IApolloClient,
  IFetchQueryObservableParams,
} from "../interfaces";
import {
  ApolloClient,
  OperationVariables,
  Observable,
  InMemoryCache,
  DefaultContext,
  MutationOptions,
  FetchResult,
} from "@apollo/client";
import { cloneDeep } from "lodash";

type INextParams = [{ data: unknown }];

export const recordAllOperations = (
  client: ApolloClient<InMemoryCache>,
  setAllApolloOperations: ISetAllApolloOperations
) => {
  const cleanUpFetchQueryObservable = trackFetchQueryObservable(
    client,
    setAllApolloOperations
  );

  const cleanUpMutate = trackClientMutateFn(client, setAllApolloOperations);

  return () => {
    cleanUpMutate();
    cleanUpFetchQueryObservable();
  };
};

const trackFetchQueryObservable = (
  client: ApolloClient<InMemoryCache>,
  setAllApolloOperations: ISetAllApolloOperations
) => {
  let nextCount = 0;
  let errorCount = 0;
  let completeCount = 0;
  let count = 0;

  const originalFetchQueryObservable = (client as unknown as IApolloClient)
    .queryManager.fetchQueryObservable;
  (client as unknown as IApolloClient).queryManager.fetchQueryObservable =
    function override(...args: IFetchQueryObservableParams) {
      const options = args[1];
      const observable = originalFetchQueryObservable.apply(this, args);
      const operationCount: number = count + 1;
      count++;
      setAllApolloOperations((state: IAllOperations) => {
        state[operationCount] = {
          query: options.query,
          variables: options.variables,
          isActive: true,
          dataId: DataId.ROOT_QUERY,
        };
      });

      const subscription = observable.subscribe({
        next: (...args: INextParams) => {
          nextCount = nextCount + 1;
          setAllApolloOperations((state: IAllOperations) => {
            const prev = state[operationCount];
            state[operationCount] = {
              ...prev,
              result: cloneDeep(args && args.length && args[0].data),
            };
          });
        },
        error: (...args: unknown[]) => {
          errorCount = errorCount + 1;
          subscription &&
            subscription.unsubscribe &&
            subscription.unsubscribe();
          setAllApolloOperations((state: IAllOperations) => {
            const prev = state[operationCount];
            state[operationCount] = { ...prev, error: cloneDeep(args) };
          });
        },
        complete: (..._args: unknown[]) => {
          completeCount = completeCount + 1;
          subscription &&
            subscription.unsubscribe &&
            subscription.unsubscribe();

          setAllApolloOperations((state: IAllOperations) => {
            const prev = state[operationCount];
            state[operationCount] = { ...prev, isActive: false };
          });
        },
      });

      return observable as unknown as Observable<unknown>;
    };
  return () => {
    (client as unknown as IApolloClient).queryManager.fetchQueryObservable =
      originalFetchQueryObservable;
  };
};

const trackClientMutateFn = (
  client: ApolloClient<InMemoryCache>,
  setAllApolloOperations: ISetAllApolloOperations
) => {
  let lastPromise: Promise<unknown> | undefined;
  let operationIndex = 100000;
  const originalMutateFn = client.mutate;
  client.mutate = function override(...mutateArgs) {
    const obj = mutateArgs[0];
    const { mutation, variables } = obj;
    const resultPromise = originalMutateFn.apply(this, mutateArgs);

    const setRawDataCb = (result: unknown) => {
      setAllApolloOperations((data: IAllOperations) => {
        data[operationIndex++] = {
          dataId: DataId.ROOT_MUTATION,
          query: mutation,
          variables: variables as unknown as OperationVariables,
          result: cloneDeep(result),
          isActive: false,
        };

        return data;
      });
    };

    if (lastPromise === undefined) {
      lastPromise = resultPromise;
    }
    lastPromise
      ?.then(() => {
        resultPromise.then((result: unknown) => {
          setRawDataCb(result);
        });
      })
      .catch(() => {
        resultPromise.then((result: unknown) => {
          setRawDataCb(result);
        });
      });

    lastPromise = resultPromise;
    return resultPromise;
  };

  return () => {
    client.mutate = originalMutateFn;
  };
};
