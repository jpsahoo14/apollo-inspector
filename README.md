# What is Apollo-Inspector

### Tool to track all graphql request being executed by [Apollo-client](https://github.com/apollographql/apollo-client).

<br />

# Why

When a view is rendered, it might make multiple queries to fetch the data. In the network tab, one would only see the requests which actually went to Graphql server. With this tool, one can also see the requests which got resolved from the apollo-cache.<br>
This tools also helps to determine, due to what operation, a watch query is re-rendered.

# Usage

Create a instance of ApolloInspector and pass an array of `IApolloClientObject` to it. Calling the instance method startTrackingSubscription with `IInspectorObservableTrackingConfig` object will start recording all operations being executed by the apollo-clients.

One can use the [apollo-inspector-ui package](https://www.npmjs.com/package/apollo-inspector-ui?activeTab=readme) which integrates this library and provides a UI for it.

```js
const mainApolloClient = new ApolloClient(...mainConfig);
const userApolloClient = new ApolloClient(...mainConfig);
.
.
.
const inspector = new ApolloInspector([
    { clientId: "main", client: mainApolloClient },
    { clientId: "user", client: userApolloClient },
  ]);
const observable = inspector.startTrackingSubscription();

observable.subscribe({
  next: (data: IDataView) => {
    // business logic
  },
  error: () => {},
  complete: () => {},
});

```

The `startTrackingSubscription` method accepts a config of type `IInspectorObservableTrackingConfig`.

```ts
interface IInspectorObservableTrackingConfig {
  hooks?: IHook[];
  apolloClientIds: string[];
  enableDebugger?: boolean;
  delayOperationsEmitByInMS?: number;
}
```

Here<br>
`hooks`: These are interceptor where one can transform data from one type to another type<br>
`apolloClientIds`: Pass an array of clientIds which needs to be tracked. These clientIds should be <br>
`delayOperationsEmitByInMS`: <br>

```ts
interface IDataView {
  operations: IOperation[] | null;
  verboseOperations: IVerboseOperation[] | null;
}
```

One can read the list of operations from `operations`/`verboseOperations`.

For each verboseOperation/operations, one can see all the below details
For most of the cases, one only need `operations` list

```ts
interface IVerboseOperation {
  affectedQueries: DocumentNode[]; // Re-rendered queries due to result of this operation
  affectedQueriesDueToOptimisticResponse?: DocumentNode[];
  cacheSnapshot: unknown;
  clientId: string;
  duration?: IVerboseOperationDuration | undefined; // amount of time spent in each phase
  error: unknown; // Error object in case of failure
  fetchPolicy: WatchQueryFetchPolicy | undefined;
  id: number; // operationId
  isActive?: boolean;
  isOptimistic?: boolean;
  operationName: string | undefined; // Name of operation
  operationString: string;
  operationType: OperationType; // Type of operation, whether its qquery, mutation, subscription
  optimisticResult?: IOperationResult;
  relatedOperations: IRelatedOperation;
  result: IOperationResult[]; // results of the operation.
  status: OperationStatus;
  timing: ITiming | undefined; // Time information relative to start recording at 0 seconds
  variables: OperationVariables | undefined;
  warning: unknown[] | undefined; // apollo client internal warning while reading data from cache
}
```

## What kind of issues can be debugged using the tool

- Helps figuring out `unwanted operations` being fired in render phase
- Help in figuring out the reasons for `multiple re-renders` of the same watch query​
- Help figuring out issues with `conflicting queries​`
- Shows field name in case `missing field error`
- Detailed time info lets you figure out if queries are being fired in `Waterfall model` or not.
- Helps figuring out if `data is taking too much time` to get written to cache.
- Shows why an operation failed
