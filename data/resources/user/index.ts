import { createDataAPI, PostUser, PutUser, User } from '../../api';
import { OperationType } from '../../../lib/types';
import { deleteUser, mergeUser, toData } from './transformations';

export function createUserConfig(api: ReturnType<typeof createDataAPI>) {
  return {
    query: () => api.user.getAll().then(toData),
    mutations: {
      create: {
        query: (user: PostUser) => api.user.post(user),
        type: OperationType.Create,
      },
      delete: {
        query: (id: number) => api.user.delete(id),
        options: {
          optimisticUpdate: (user: User) => (data: User[] | null) =>
            deleteUser(data, user),
          refetchOnSuccess: true,
        },
        type: OperationType.Delete,
      },
      update: {
        query: (user: PutUser) => api.user.put(user),
        options: {
          optimisticUpdate: (user: PutUser) => (data: User[] | null) =>
            mergeUser(data, user),
        },
        type: OperationType.Update,
      },
    },
    name: 'users',
    options: {
      lazy: true,
      keepUnusedDataFor: 60,
      pollingInterval: 360,
    },
  };
}
