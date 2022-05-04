import * as React from 'react';
import { useComments } from '.';
import { useUsers } from '.';
import './style.css';

export default function App() {
  // const {
  //   isLoading,
  //   isUninitialized,
  //   isUpdating,
  //   error,
  //   data,
  //   mutations,
  //   refetch,
  // } = useUsers();
  // const {
  //   isLoading: isLoadingComments,
  //   isUninitialized: isUninitializedComments,
  //   isUpdating: isUpdatingComments,
  //   error: errorComments,
  //   data: dataComments,
  //   mutations: mutationsComments,
  //   refetch: refetchComments,
  // } = useComments();
  return (
    <div>
      {/* <div>
        {JSON.stringify({
          isLoading,
          isUninitialized,
          isUpdating,
          error,
          data,
        })}
      </div>
      <button onClick={(e) => refetch()}>Fetch Users</button> */}
      {/* <button onClick={(e) => mutations.create()}>Fetch</button>
      {/* <div>
        {JSON.stringify({
          isLoadingComments,
          isUninitializedComments,
          isUpdatingComments,
          errorComments,
          dataComments,
        })}
      </div>
      <button onClick={(e) => refetchComments()}>Fetch Comments</button> */}
    </div>
  );
}
