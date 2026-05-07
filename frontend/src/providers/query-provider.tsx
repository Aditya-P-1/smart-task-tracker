import { PropsWithChildren, useEffect } from 'react';
import { AppState } from 'react-native';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';

import { handleGlobalApiError, shouldRetryApiRequest } from '../api/api-error';
import {
  refreshNetworkSnapshot,
  startNetworkStatusListener,
  subscribeToNetworkStatus,
} from '../offline/network/network-service';

export const appQueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      handleGlobalApiError(error, 'mutation', mutation.options.mutationKey?.join('.') ?? 'unknown-mutation');
    },
  }),
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => shouldRetryApiRequest(error, failureCount),
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      staleTime: 30_000,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      handleGlobalApiError(error, 'query', query.queryKey.join('.'));
    },
  }),
});

export function resetAppQueryCache() {
  appQueryClient.clear();
}

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    void refreshNetworkSnapshot().then((snapshot) => {
      onlineManager.setOnline(snapshot.isOnline);
    });

    const unsubscribeNetworkListener = startNetworkStatusListener();
    const unsubscribeNetworkStatus = subscribeToNetworkStatus((snapshot) => {
      onlineManager.setOnline(snapshot.isOnline);
    });

    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });

    return () => {
      unsubscribeNetworkListener();
      unsubscribeNetworkStatus();
      subscription.remove();
    };
  }, []);

  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
