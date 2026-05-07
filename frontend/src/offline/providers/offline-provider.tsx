import { PropsWithChildren, useEffect } from 'react';
import { AppState } from 'react-native';

import {
  refreshNetworkSnapshot,
  startNetworkStatusListener,
  subscribeToNetworkStatus,
} from '../network/network-service';
import { processOfflineQueue, scheduleQueuedSync } from '../sync/offline-sync-service';

export function OfflineProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    scheduleQueuedSync(0);
    void refreshNetworkSnapshot();

    const unsubscribeNetwork = startNetworkStatusListener();
    const unsubscribeStatus = subscribeToNetworkStatus((snapshot) => {
      if (snapshot.isOnline) {
        scheduleQueuedSync(0);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void processOfflineQueue();
      }
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeStatus();
      appStateSubscription.remove();
    };
  }, []);

  return children;
}
