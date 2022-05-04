import { Dispatch, Reducer } from 'redux';
import { mergeReducers } from '../merge-reducers';
import { createDataSlice } from './api/data-slice';
import {
  Mutations,
  Data,
  Err,
  QueryParams,
  ResourceConfig,
  Registry,
  MutationParams,
  OperationType,
  Subscribable,
  State,
  FinalReturnType,
} from './types';

export function createResource<T extends ResourceConfig>(
  config: T,
  registry: Registry,
  dispatch: Dispatch,
  getState: () => any,
  registerReducer: (id: string, newReducer: Reducer) => () => void
) {
  const listeners = {
    onError: [],
    onFetch: [],
    onSuccess: [],
  };

  return { subscribe };

  function createNotifyError(id: string) {
    return function notifyError(name: string, error: Err<T>) {
      notify(id, listeners.onError, name, [error]);
    };
  }

  function createNotifyFetch(id: string) {
    return function notifyFetch(name: string, ...params: QueryParams<T>) {
      notify(id, listeners.onFetch, name, params);
    };
  }

  function createNotifySuccess(id: string) {
    return function notifySuccess(name: string, data: Data<T>) {
      notify(id, listeners.onSuccess, name, [data]);
    };
  }

  function notify<T extends any[]>(
    id: string,
    lists: any[],
    name: string,
    params: T
  ) {
    const subscribable = registry.get(id);

    if (!subscribable || !lists.length) {
      return;
    }
    const state = subscribable.select();

    for (const listener of lists) {
      if (listener.method === name) {
        listener.callback({ state }, ...params);
      }
    }
  }

  function onError<K extends 'get' | keyof Mutations<T>>(
    method: K,
    callback: (
      { state }: { state: State<Data<T>, Err<T>> },
      error: Err<T>
    ) => void
  ) {
    listeners.onError.push({ method, callback });
  }

  function onFetch<K extends 'get' | keyof Mutations<T>>(
    method: K,
    callback: (
      { state }: { state: State<Data<T>, Err<T>> },
      ...params: T extends keyof Mutations<T>
        ? MutationParams<T, K>
        : QueryParams<T>
    ) => void
  ) {
    listeners.onFetch.push({ method, callback });
  }

  function onSuccess<K extends 'get' | keyof Mutations<T>>(
    method: K,
    callback: (
      { state }: { state: State<Data<T>, Err<T>> },
      data: T extends keyof Mutations<T>
        ? FinalReturnType<T['mutations'][K]['query']>
        : Data<T>
    ) => void
  ) {
    listeners.onSuccess.push({ method, callback });
  }

  function subscribe(...params: QueryParams<T>) {
    const id = createEndpointId(config.name, params);

    if (!registry.has(id)) {
      registry.set(id, {
        destroyEndpoint,
        manualUpdate,
        mutations: {} as Mutations<T>,
        notifyError: createNotifyError(id),
        notifyFetch: createNotifyFetch(id),
        notifySuccess: createNotifySuccess(id),
        refetch,
        select,
        startSelfDestructTimeout,
        subscriptions: new Set(),
      });
    }

    const subscribable = registry.get(id) as Subscribable<T>;

    // Clear the self destruct timer if it exists because we're adding a new subscription
    subscribable.clearSelfDestructTimeout?.();

    // Add a new subscription
    subscribable.subscriptions.add(unsubscribe);

    const handleError = (name: string, error: Err<T>) => {
      if (config['options'].refetchOnError) {
        refetch();
      }

      subscribable.notifyError(name, error);
    };

    const fetchSlice = createDataSlice<Data<T>, Err<T>, QueryParams<T>>({
      dispatch,
      endpointId: id,
      getState: () => subscribable.select(),
      name: 'get',
      onError: handleError,
      onFetch: subscribable.notifyFetch,
      onSuccess: subscribable.notifySuccess,
      query: config['query'],
      resource: config.name,
      type: OperationType.Read,
    });

    const mutateReducersArr = [];

    if (config.mutations) {
      for (const mutateMethodName of Object.keys(config.mutations)) {
        const handleSuccess = (name: string, data: Data<T>) => {
          if (config.mutations[mutateMethodName]['options'].refetchOnSuccess) {
            refetch();
          }

          subscribable.notifySuccess(name, data);
        };

        const mutationSlice = createDataSlice<
          Data<T>,
          Err<T>,
          MutationParams<T, typeof mutateMethodName>
        >({
          dispatch,
          endpointId: id,
          getState: () => subscribable.select(),
          name: mutateMethodName,
          onError: subscribable.notifyError,
          onFetch: subscribable.notifyFetch,
          onSuccess: handleSuccess,
          optimisticUpdate:
            config.mutations[mutateMethodName]['options']?.optimisticUpdate,
          query: config.mutations[mutateMethodName]['query'],
          resource: config.name,
          type:
            config.mutations[mutateMethodName]['type'] ||
            (mutateMethodName as OperationType),
        });

        // @ts-ignore
        subscribable.mutations[mutateMethodName] = mutationSlice.call;
        mutateReducersArr.push(mutationSlice.reducer);
      }
    }

    subscribable.reducer = mergeReducers([
      fetchSlice.reducer,
      ...mutateReducersArr,
    ]);

    // register reducer
    subscribable.unregisterReducer = registerReducer(id, subscribable.reducer);

    // Fetch immediately if not lazy
    if (!config.options?.lazy) {
      subscribable.refetch();
    }

    return {
      unsubscribe,
      refetch: subscribable.refetch,
      manualUpdate: subscribable.manualUpdate,
      mutations: subscribable.mutations,
      select: subscribable.select,
    };

    async function refetch() {
      if (
        config.options?.pollingInterval &&
        subscribable?.pollingInterval === undefined
      ) {
        subscribable.pollingInterval = setInterval(() => {
          fetchSlice.call(...params);
        }, <number>config.options?.pollingInterval * 1000);

        // Polling interval doesn't start immediately,
        // so we still fetch immediately below.
      }

      return fetchSlice.call(...params);
    }

    function unsubscribe() {
      subscribable.subscriptions.delete(unsubscribe);

      // If there are no more subscriptions, then we want to remove the reducer and endpoint.
      if (subscribable.subscriptions.size === 0) {
        startSelfDestructTimeout(config.options?.keepUnusedDataFor);
      }
    }

    function destroyEndpoint() {
      clearInterval(subscribable.pollingInterval);
      subscribable.clearSelfDestructTimeout?.();
      subscribable.unregisterReducer?.();
      delete subscribable[id];
    }

    function manualUpdate(data: Data<T>) {
      dispatch({
        type: `${config.name}/get/manual`,
        payload: data,
      });
    }

    function select(): State<Data<T>, Err<T>> | undefined {
      return getState()?.[id] as State<Data<T>, Err<T>> | undefined;
    }

    function startSelfDestructTimeout(timeInSeconds = 0) {
      const timeout = setTimeout(() => {
        destroyEndpoint();
      }, timeInSeconds * 1000);

      subscribable.clearSelfDestructTimeout =
        function clearSelfDestructTimeout() {
          clearTimeout(timeout);
        };
    }
  }
}

export type Resource = ReturnType<typeof createResource>;

function createEndpointId(key, params) {
  return `${key}|${JSON.stringify(params)}`;
}
