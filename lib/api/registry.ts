import { Registry, Subscribable } from '../types';

export function createRegistry(): Registry {
  const subscribables = new Map<string, Subscribable>();

  return subscribables;
}
