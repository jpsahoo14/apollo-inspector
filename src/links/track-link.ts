import { ApolloLink, Observable, FetchResult } from "@apollo/client";
import {
  ISetVerboseApolloOperations,
  IApolloInspectorState,
  OperationStage,
  IVerboseOperationMap,
  QueryOperation,
} from "../interfaces";
import { resumeOperation } from "../apollo-inspector-utils";

export const trackLink = (
  rawData: IApolloInspectorState,
  setVerboseApolloOperations: ISetVerboseApolloOperations
): ApolloLink => {
  const map: { [key: string]: boolean } = {};
  const trackLink = new ApolloLink((operation, forward) => {
    const operationId = rawData.currentOperationId;
    if (rawData.enableDebug && operationId !== 0 && map[operationId]) {
      debugger;
    }
    map[operationId] = true;
    rawData.enableDebug &&
      console.log(`APD operationId:${operationId} set-track-link`);
    const linkEnterTime = performance.now();
    setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
      const op = opMap.get(operationId);
      op && (op.duration.linkEnterTime = linkEnterTime);
    });

    return new Observable((observer) => {
      const linkExecutionStartTime = performance.now();
      rawData.enableDebug &&
        console.log(`APD operationId:${operationId} linkExecutionStart`);
      setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
        const op = opMap.get(operationId) as QueryOperation | undefined;
        if (op) {
          op.duration.linkExecutionStartTime = linkExecutionStartTime;
          op.setOperationStage(OperationStage.linkExecutionStart);
        }
      });

      const observable = forward(operation);

      const subscription = observable.subscribe({
        next: (result: unknown) => {
          const cb = (): void => {
            const linkNextExecutionTime = performance.now();
            setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
              rawData.enableDebug &&
                console.log(
                  `APD operationId:${operationId} linkNextExecution`,
                  result
                );

              const op = opMap.get(operationId) as QueryOperation | undefined;
              if (op) {
                op.duration.linkNextExecutionTime?.push(linkNextExecutionTime);
                op.setOperationStage(OperationStage.linkNextExecution);
              }
            });

            !observer.closed &&
              observer.next(
                result as FetchResult<
                  {
                    [key: string]: unknown;
                  },
                  Record<string, unknown>,
                  Record<string, unknown>
                >
              );
          };

          resumeOperation(rawData, operationId, cb);
        },
        error: (error: unknown) => {
          const cb = () => {
            rawData.enableDebug &&
              console.log(
                `APD operationId:${operationId} linkErrorExecutionTime`
              );

            const linkErrorExecutionTime = performance.now();
            setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
              const op = opMap.get(operationId);
              op &&
                (op.duration.linkErrorExecutionTime = linkErrorExecutionTime);
            });

            !observer.closed && observer.error(error);
            subscription.unsubscribe();
          };
          resumeOperation(rawData, operationId, cb);
        },
        complete: () => {
          const cb = () => {
            rawData.enableDebug &&
              console.log(
                `APD operationId:${operationId} linkCompleteExecution`
              );

            const linkCompleteExecutionTime = performance.now();
            setVerboseApolloOperations((opMap: IVerboseOperationMap) => {
              const op = opMap.get(operationId) as QueryOperation | undefined;
              if (op) {
                op.duration.linkCompleteExecutionTime =
                  linkCompleteExecutionTime;
                op.setOperationStage(OperationStage.linkCompleteExecution);
              }
            });

            !observer.closed && observer.complete();
          };

          resumeOperation(rawData, operationId, cb);
        },
      });
    });
  });

  return trackLink;
};
