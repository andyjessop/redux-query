/**
 * The main configuration object for a resource.
 */
export type ResourceConfig<Data = any> = {
  query:
    | ((...params: any[]) => (data: Data) => Promise<Data>)
    | ((...params: any[]) => Promise<Data>);
  mutations: {
    [key: string]: {
      query:
        | ((...params: any[]) => (data: Data) => any)
        | ((...params: any[]) => any);
      options?: {
        optimisticUpdate?:
          | ((...params: any[]) => (data: Data) => any)
          | ((...params: any[]) => any);
        refetchOnSuccess?: boolean;
      };
      type: OperationType;
    };
  };
  name: string;
  options?: {
    lazy?: boolean;
    keepUnusedDataFor?: number;
    pollingInterval?: number;
    refetchOnError?: boolean;
  };
};

export type OptimisticUpdate<Data = any> =
  | ((...params: any[]) => (data: Data) => any)
  | ((...params: any[]) => any);

export type State<D, E> = {
  data: D | null;
  error: E | null;
  loading: boolean;
  updating: boolean;
};

export enum OperationType {
  Create = 'create',
  Delete = 'delete',
  Read = 'read',
  Update = 'update',
}

/**
 * Parameters for the main 'get' query of the resource.
 */
export type QueryParams<T extends ResourceConfig> = Parameters<T['query']>;

/**
 * Parameters of a specific mutation function.
 */
export type MutationParams<
  T extends ResourceConfig,
  K extends keyof T['mutations']
> = T['mutations'][K]['query'] extends (...params: infer R) => any ? R : any[];

/**
 * An object of mutation functions.
 */
export type Mutations<T extends ResourceConfig> = {
  [P in keyof T['mutations']]: (
    ...params: MutationParams<T, P>
  ) => FinalReturnType<T['mutations'][P]['query']>;
};

export type OptimisticUpdateParams<
  T extends ResourceConfig,
  K extends keyof T['mutations']
> = MutationParams<T, K>;

/**
 * The Data value comes from the return type of the main query.
 */
export type Data<T extends ResourceConfig> = FinalReturnPromiseType<T['query']>;

export type Err<T extends ResourceConfig> = Error;

export type Subscribable<T extends ResourceConfig = any> = {
  clearSelfDestructTimeout?: () => void;
  destroyEndpoint: () => void;
  refetch: () => Promise<void>;
  manualUpdate: (data: Data<T>) => void;
  mutations: Mutations<T>;
  notifyError: (name: string, error: Error) => void;
  notifyFetch: (name: string, ...params: Parameters<T['query']>) => void;
  notifySuccess: (name: string, data: Data<T>) => void;
  pollingInterval?: ReturnType<typeof setInterval>;
  reducer?: (
    state: any,
    action: { type: string; payload: any }
  ) => State<Data<T>, any>;
  select: () => State<Data<T>, any>;
  startSelfDestructTimeout: (timeInSeconds?: number) => void;
  subscriptions: Set<() => void>;
  unregisterReducer?: () => void;
};

export type Registry = Map<string, Subscribable>;

/**
 * Get the return type of the last function in a curried chain. If the result is a Promise,
 * it returns the resolved type.
 */
export type FinalReturnPromiseType<T> = {
  0: T;
  1: T extends (...args: any) => infer R | Promise<infer R>
    ? FinalReturnPromiseType<R>
    : T;
}[T extends (...args: any) => infer _ | Promise<infer _> ? 1 : 0];

export type FinalReturnType<T> = {
  0: T;
  1: T extends (...args: any) => infer R ? FinalReturnType<R> : T;
}[T extends (...args: any) => infer _ ? 1 : 0];
