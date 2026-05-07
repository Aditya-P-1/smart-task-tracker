import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineProvider } from '../offline/providers/offline-provider';
import { QueryProvider } from './query-provider';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <OfflineProvider>{children}</OfflineProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
