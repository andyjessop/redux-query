import { configureStore } from '@reduxjs/toolkit';
import * as React from 'react';
import { Provider } from 'react-redux';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import {
  createResource,
  dataAPI,
  middleware,
  reducer,
  reducerId,
} from './data';
import { createUserConfig } from './data/resources/user';
import { createCommentConfig } from './data/resources/comment';
import { createUseQuery } from './lib/use-query';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

const store = configureStore({
  reducer: {
    [reducerId]: reducer,
  },
  middleware: [middleware],
});

// Create resources
export const users = createResource(createUserConfig(dataAPI));
export const comments = createResource(createCommentConfig(dataAPI));

// Create hooks to consume the APIs
export const useUsers = createUseQuery(users);
export const useComments = createUseQuery(comments);

/**
 * UNCOMMENT TO SEE CORRECT ACTIONS FIRED IN CONSOLE
 */
async function main() {
  const { mutations, refetch, select } = users.subscribe();

  const res = refetch();

  // loading: true, updating: false, data and error null
  console.log(select());

  // Once fetch call has been made.
  await res;

  // Data arrived
  console.log(select());

  const res2 = refetch();

  // Now loading: true, and updating: true
  console.log(select());

  await res2;

  console.log(select());

  await mutations.delete(1);
}

main();
/**
 * END OF COMMENT
 */

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
