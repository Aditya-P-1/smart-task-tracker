import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from './query-provider';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryProvider>{children}</QueryProvider>
    </SafeAreaProvider>
  );
}
