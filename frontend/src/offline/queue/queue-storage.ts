import { STORAGE_KEYS } from '../../constants/storage-keys';
import { storageService } from '../../storage/mmkv';
import type { OfflineAction, OfflineQueueState } from '../types';

let cachedQueueState: OfflineQueueState | null = null;
let hasLoadedQueueState = false;

function createInitialOfflineQueueState(): OfflineQueueState {
  return {
    actions: [],
    entityIdMap: {},
    updatedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasStringPayload(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDateString(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isValidOfflineAction(value: unknown): value is OfflineAction {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !hasStringPayload(value.id) ||
    !isValidDateString(value.createdAt) ||
    !hasStringPayload(value.targetId) ||
    !hasStringPayload(value.userId) ||
    typeof value.attemptCount !== 'number' ||
    (typeof value.nextRetryAt !== 'undefined' && !isValidDateString(value.nextRetryAt))
  ) {
    return false;
  }

  switch (value.type) {
    case 'CREATE_TASK':
      return isRecord(value.payload) && hasStringPayload(value.payload.title);
    case 'UPDATE_TASK':
      return isRecord(value.payload);
    case 'DELETE_TASK':
    case 'DELETE_HABIT':
      return true;
    case 'CREATE_HABIT':
      return isRecord(value.payload) && hasStringPayload(value.payload.title);
    case 'CHECKIN_HABIT':
      return hasStringPayload(value.dayKey);
    default:
      return false;
  }
}

function sanitizeQueueState(state: OfflineQueueState) {
  const dedupedActionIds = new Set<string>();
  const actions = state.actions.filter((action) => {
    if (!isValidOfflineAction(action) || dedupedActionIds.has(action.id)) {
      return false;
    }

    dedupedActionIds.add(action.id);
    return true;
  });

  const referencedTargetIds = new Set(actions.map((action) => action.targetId));
  const entityIdMap = Object.fromEntries(
    Object.entries(state.entityIdMap).filter(
      ([targetId, resolvedId]) =>
        referencedTargetIds.has(targetId) &&
        typeof targetId === 'string' &&
        targetId.length > 0 &&
        typeof resolvedId === 'string' &&
        resolvedId.length > 0,
    ),
  );

  return {
    actions,
    entityIdMap,
    updatedAt: isValidDateString(state.updatedAt) ? state.updatedAt : new Date().toISOString(),
  };
}

function setCachedQueueState(state: OfflineQueueState) {
  cachedQueueState = state;
  hasLoadedQueueState = true;
}

export function getOfflineQueueState() {
  if (hasLoadedQueueState && cachedQueueState) {
    return cachedQueueState;
  }

  const rawState = storageService.getString(STORAGE_KEYS.offlineQueueState);

  if (!rawState) {
    const initialState = createInitialOfflineQueueState();
    setCachedQueueState(initialState);
    return initialState;
  }

  try {
    const parsedState = JSON.parse(rawState) as OfflineQueueState;

    if (
      !parsedState ||
      !Array.isArray(parsedState.actions) ||
      !parsedState.entityIdMap ||
      typeof parsedState.entityIdMap !== 'object'
    ) {
      clearOfflineQueueState();
      const initialState = createInitialOfflineQueueState();
      setCachedQueueState(initialState);
      return initialState;
    }

    const sanitizedState = sanitizeQueueState({
      ...createInitialOfflineQueueState(),
      ...parsedState,
    });

    if (
      sanitizedState.actions.length !== parsedState.actions.length ||
      Object.keys(sanitizedState.entityIdMap).length !== Object.keys(parsedState.entityIdMap).length
    ) {
      saveOfflineQueueState(sanitizedState);
      return sanitizedState;
    }

    setCachedQueueState(sanitizedState);
    return sanitizedState;
  } catch {
    clearOfflineQueueState();
    const initialState = createInitialOfflineQueueState();
    setCachedQueueState(initialState);
    return initialState;
  }
}

export function saveOfflineQueueState(state: OfflineQueueState) {
  const sanitizedState = sanitizeQueueState(state);
  setCachedQueueState(sanitizedState);

  storageService.set(
    STORAGE_KEYS.offlineQueueState,
    JSON.stringify({
      ...sanitizedState,
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
  cachedQueueState = createInitialOfflineQueueState();
  hasLoadedQueueState = true;
  storageService.remove(STORAGE_KEYS.offlineQueueState);
}
