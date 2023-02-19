# What is Apollo-Inspector

### Tool to track all graphql request being executed by [Apollo-client](https://github.com/apollographql/apollo-client).

<br />

# Usage

Create a instance of ApolloInspector and pass an apolloClient to it. It'd start tracking all operations done using that apolloClient once, `startTracking` method is called upon it.

```js
const apolloClient = new ApolloClient({...config})
.
.
.
const inspector = new ApolloInspector(apolloClient);
const stopTracking = inspector.startTracking();
const graphqlRequests = stopTracking();

```

The `startTracking` method accepts a config of type `IInspectorTrackingConfig`.

```ts
interface IInspectorTrackingConfig {
  trackCacheOperation?: boolean;
  trackVerboseOperations?: boolean;
  trackAllOperations?: boolean;
}
```

Here one can define, what types of operations needs to be tracked.<br />

`trackCacheOperation`: Tracks operations only which writes data to inMemoryCache.<br />
`trackAllOperations`: Tracks all queries and mutations graphql request.<br />
`trackVerboseOperations`: Tracks query operations for now. Tracking mutations is under progress<br />
<br /><br />
The `stopTracking` method returns an object of type `IDataView`.

```ts
interface IDataView {
  operations: IOperation[] | null;
  verboseOperations: IVerboseOperation[] | null;
  allOperations: IOperation[] | null;
}
```

One can read the list of operations from `operations`/`verboseOperations`/`allOperations`.

For each verboseOperation, one can see all the below details

```ts
interface IVerboseOperation {
  id: number; // operationId
  operationType: OperationType; // Type of operation, whether its qquery, mutation, subscription
  operationName: string | undefined; // Name of operation
  operationString: string;
  variables: OperationVariables | undefined;
  error: unknown; // Error object in case of failure
  warning: unknown[] | undefined; // apollo client internal warning while reading data from cache
  result: IOperationResult[]; // results of the operation.
  optimisticResult?: IOperationResult;
  isOptimistic?: boolean;
  affectedQueries: DocumentNode[]; // Re-rendered queries due to result of this operation
  isActive?: boolean;
  duration?: IVerboseOperationDuration | undefined; // amount of time spent in each phase
  fetchPolicy: WatchQueryFetchPolicy | undefined;
  timing: ITiming | undefined; // Time information relative to start recording at 0 seconds
  status: OperationStatus;
}
```
