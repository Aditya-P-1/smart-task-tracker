import { STORAGE_KEYS } from '../../constants/storage-keys';
import { storageService } from '../../storage/mmkv';
import type { OfflineQueueState } from '../types';

function createInitialOfflineQueueState(): OfflineQueueState {
  return {
    actions: [],
    entityIdMap: {},
    updatedAt: new Date().toISOString(),
  };
}

export function getOfflineQueueState() {
  const rawState = storageService.getString(STORAGE_KEYS.offlineQueueState);

  if (!rawState) {
    return createInitialOfflineQueueState();
  }

  try {
    const parsedState = JSON.parse(rawState) as OfflineQueueState;

    if (
      !parsedState ||
      !Array.isArray(parsedState.actions) ||
      !parsedState.entityIdMap ||
      typeof parsedState.entityIdMap !== 'object'
    ) {
      return createInitialOfflineQueueState();
    }

    return {
      ...createInitialOfflineQueueState(),
      ...parsedState,
    };
  } catch {
    return createInitialOfflineQueueState();
  }
}

export function saveOfflineQueueState(state: OfflineQueueState) {
  storageService.set(
    STORAGE_KEYS.offlineQueueState,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function updateOfflineQueueState(
  updater: (state: OfflineQueueState) => OfflineQueueState,
) {
  const nextState = updater(getOfflineQueueState());
  saveOfflineQueueState(nextState);
  return nextState;
}

export function clearOfflineQueueState() {
  storageService.remove(STORAGE_KEYS.offlineQueueState);
}
