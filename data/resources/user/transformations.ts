import { PutUser, Response, User } from '../../api';

export function toData(response: Response<User[]>) {
  return response.data;
}

export function deleteUser(data: User[] | null, user: User) {
  if (data === null) {
    return data;
  }

  return data.filter((u) => user.id !== u.id);
}

export function mergeUser(data: User[] | null, user: PutUser) {
  if (data === null) {
    return data;
  }

  const ndx = data?.findIndex((u) => u.id === user.id);

  if (ndx === -1) {
    return data;
  }

  data[ndx] = {
    ...data[ndx],
    ...user,
  };

  return data;
}
