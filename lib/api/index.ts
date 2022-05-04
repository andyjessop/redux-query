import {
  AnyAction,
  combineReducers,
  Dispatch,
  MiddlewareAPI,
  Reducer,
} from 'redux';
import { createResource, Resource } from '../resource';
import { ResourceConfig, Subscribable } from '../types';
import { createRegistry } from './registry';

export function createAPI(rId: string) {
  const registry = createRegistry();
  const reducers = new Map<string, Reducer>();
  let currentReducer: Reducer;
  const reducerId = rId;

  let dispatch: Dispatch;
  let getAPIState: () => any;

  return {
    createResource: createAPIResource,
    middleware,
    reducer,
    reducerId,
  };

  function createAPIResource<T extends ResourceConfig>(config: T) {
    const resource = createResource(
      config,
      registry,
      dispatch,
      getAPIState,
      registerReducer
    );

    return resource;
  }

  function middleware(api: MiddlewareAPI<Dispatch, unknown>) {
    // Capture reference to dispatch and getState from store
    dispatch = api.dispatch;
    getAPIState = () => api.getState()?.[reducerId];

    return function withNext(next: Dispatch<AnyAction>) {
      return function handleAction(action: AnyAction): void {
        next(action);

        console.log(action);

        // Refetch on success
      };
    };
  }

  function reducer<S>(state: S, action: AnyAction) {
    if (!currentReducer) {
      return state ?? {};
    }

    return currentReducer(state, action);
  }

  function registerReducer(id: string, newReducer: Reducer) {
    reducers.set(id, newReducer);

    currentReducer = combineReducers(Object.fromEntries(reducers));

    dispatch({
      payload: { id },
      type: `${reducerId}/initReducer`,
    });

    return function unregisterReducer() {
      reducers.delete(id);

      currentReducer = combineReducers(Object.fromEntries(reducers));
    };
  }
}

function isFulfilled(type: string) {
  return type.endsWith('fulfilled');
}
