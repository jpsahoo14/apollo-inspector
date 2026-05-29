import {
  DataId,
  ISetAllApolloOperations,
  IAllOperations,
  IApolloClientObject,
} from "../interfaces";
import {
  ApolloClient,
  OperationVariables,
  NormalizedCacheObject,
  DefaultContext,
  MutationOptions,
  FetchResult,
} from "@apollo/client";
import { cloneDeep } from "lodash-es";
import type { DocumentNode } from "graphql";
import {
  getApolloQueryManager,
  FetchConcastWithInfoParams,
  FetchQueryObservableParams,
  ObservableSubscriptionLike,
  ObservableWithPromise,
} from "../apollo-client-internals";

type INextParams = [{ data: unknown }];

export const recordAllOperations = (
  clientObj: IApolloClientObject,
  setAllApolloOperations: ISetAllApolloOperations
) => {
  const { client } = clientObj;
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
  client: ApolloClient<NormalizedCacheObject>,
  setAllApolloOperations: ISetAllApolloOperations
) => {
  let nextCount = 0;
  let errorCount = 0;
  let completeCount = 0;
  let count = 0;
  const trackedSubscriptions: ObservableSubscriptionLike[] = [];
  const queryManager = getApolloQueryManager(client);

  const recordOperationStart = (
    query: DocumentNode,
    variables: OperationVariables | undefined
  ) => {
    const operationCount: number = count + 1;
    count++;
    setAllApolloOperations((state: IAllOperations) => {
      state[operationCount] = {
        query,
        variables: variables as OperationVariables,
        isActive: true,
        dataId: DataId.ROOT_QUERY,
      };
    });
    return operationCount;
  };

  const observeOperation = (
    observable: ObservableWithPromise,
    operationCount: number
  ) => {
    let subscription: ObservableSubscriptionLike | undefined;
    const unsubscribe = () => {
      subscription?.unsubscribe();
      if (subscription) {
        const index = trackedSubscriptions.indexOf(subscription);
        if (index >= 0) {
          trackedSubscriptions.splice(index, 1);
        }
      }
    };

    subscription = observable.subscribe({
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
        unsubscribe();
        setAllApolloOperations((state: IAllOperations) => {
          const prev = state[operationCount];
          state[operationCount] = { ...prev, error: cloneDeep(args) };
        });
      },
      complete: (..._args: unknown[]) => {
        completeCount = completeCount + 1;
        unsubscribe();

        setAllApolloOperations((state: IAllOperations) => {
          const prev = state[operationCount];
          state[operationCount] = { ...prev, isActive: false };
        });
      },
    });
    trackedSubscriptions.push(subscription);
  };

  if (typeof queryManager.fetchQueryObservable === "function") {
    const originalFetchQueryObservable = queryManager.fetchQueryObservable;
    queryManager.fetchQueryObservable = function override(
      ...args: FetchQueryObservableParams
    ) {
      const options = args[1];
      const observable = originalFetchQueryObservable.apply(this, args);
      const operationCount = recordOperationStart(
        options.query,
        options.variables
      );
      observeOperation(observable as ObservableWithPromise, operationCount);

      return observable;
    };

    return () => {
      queryManager.fetchQueryObservable = originalFetchQueryObservable;
      trackedSubscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }

  if (typeof queryManager.fetchConcastWithInfo === "function") {
    const originalFetchConcastWithInfo = queryManager.fetchConcastWithInfo;
    queryManager.fetchConcastWithInfo = function override(
      ...args: FetchConcastWithInfoParams
    ) {
      const [_queryInfo, options, _networkStatus, query] = args;
      const result = originalFetchConcastWithInfo.apply(this, args);
      const operationCount = recordOperationStart(
        query || options.query,
        options.variables
      );
      observeOperation(result.concast, operationCount);
      return result;
    };

    return () => {
      queryManager.fetchConcastWithInfo = originalFetchConcastWithInfo;
      trackedSubscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }

  return () => {};
};

const trackClientMutateFn = (
  client: ApolloClient<NormalizedCacheObject>,
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
