import { useCallback, useEffect, useRef, useState } from 'react';
import { Resource } from './resource';
import { State } from './types';

export function createUseQuery<T extends Resource>(resource: T) {
  return useResource;

  function useResource(...params: Parameters<T['subscribe']>) {
    const subscription = useRef<any>();
    const [state, setState] = useState<State<any, any>>();

    useEffect(() => {
      subscription.current = resource.subscribe(...params);
      setState(subscription.current.select());
    }, []);

    const refetch = useCallback(async () => {
      await subscription.current.refetch();

      setState(subscription.current.select());
    }, [subscription.current]);

    return {
      isLoading: state?.loading,
      isUninitialized: state && !state.loading && !state.updating,
      isUpdating: state?.updating,
      error: state?.error,
      data: state?.data,
      mutations: subscription.current?.mutations,
      refetch,
    };
  }
}
