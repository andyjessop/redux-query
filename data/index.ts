import { createDataAPI } from './api';
import { createAPI } from '../lib/api';

// Mock data API
export const dataAPI = createDataAPI();

// The main redux-query API
export const { createResource, middleware, reducer, reducerId } =
  createAPI('api');
