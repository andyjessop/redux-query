import { OperationType } from '../../../lib/types';
import { createDataAPI, PostComment, PutComment, Comment } from '../../api';
import { deleteComment, mergeComment, toData } from './transformations';

export function createCommentConfig(api: ReturnType<typeof createDataAPI>) {
  return {
    query: () => api.comment.getAll().then(toData),
    mutations: {
      create: {
        query: (comment: PostComment) => api.comment.post(comment),
        type: OperationType.Create,
      },
      delete: {
        query: (id: number) => api.comment.delete(id),
        options: {
          optimisticUpdate: (user: Comment) => (data: Comment[] | null) =>
            deleteComment(data, user),
        },
        type: OperationType.Delete,
      },
      update: {
        query: (comment: PutComment) => api.comment.put(comment),
        options: {
          optimisticUpdate: (user: PutComment) => (data: Comment[] | null) =>
            mergeComment(data, user),
        },
        type: OperationType.Update,
      },
    },
    name: 'comments',
    options: {
      lazy: true,
      keepUnusedDataFor: 60,
      pollingInterval: 360,
    },
  };
}
