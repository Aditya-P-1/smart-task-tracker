import { PropsWithChildren, useEffect } from 'react';
import { AppState } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export function resetAppQueryCache() {
  appQueryClient.clear();
}

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');

    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
