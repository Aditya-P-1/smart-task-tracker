type StorageValue = boolean | number | string;

type StorageAdapter = {
  clearAll: () => void;
  getBoolean: (key: string) => boolean | undefined;
  getNumber: (key: string) => number | undefined;
  getString: (key: string) => string | undefined;
  remove: (key: string) => void;
  set: (key: string, value: StorageValue) => void;
};

type StorageRuntimeState = {
  activeAdapter: StorageAdapter;
  isUsingFallbackStorage: boolean;
  mmkvAdapter: StorageAdapter | null;
};

const memoryStore = new Map<string, StorageValue>();

function createMemoryStorage(): StorageAdapter {
  return {
    clearAll: () => {
      memoryStore.clear();
    },
    getBoolean: (key) => {
      const value = memoryStore.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber: (key) => {
      const value = memoryStore.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getString: (key) => {
      const value = memoryStore.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    remove: (key) => {
      memoryStore.delete(key);
    },
    set: (key, value) => {
      memoryStore.set(key, value);
    },
  };
}

function createMmkvAdapter() {
  try {
    const { createMMKV } = require('react-native-mmkv') as {
      createMMKV: (config: { id: string }) => StorageAdapter;
    };

    return createMMKV({
      id: 'smart-task-habit-tracker',
    });
  } catch (error) {
    console.warn(
      'MMKV native module is unavailable in this runtime. Falling back to in-memory storage. Build a development client for real MMKV persistence.',
      error,
    );

    return null;
  }
}

const memoryStorage = createMemoryStorage();
const mmkvStorage = createMmkvAdapter();

const storageRuntimeState: StorageRuntimeState = {
  activeAdapter: mmkvStorage ?? memoryStorage,
  isUsingFallbackStorage: !mmkvStorage,
  mmkvAdapter: mmkvStorage,
};

function fallbackToMemoryStorage(error: unknown, operationName: string, key?: string) {
  if (storageRuntimeState.isUsingFallbackStorage) {
    return;
  }

  storageRuntimeState.activeAdapter = memoryStorage;
  storageRuntimeState.isUsingFallbackStorage = true;

  console.warn(
    `MMKV storage failed during "${operationName}"${key ? ` for key "${key}"` : ''}. Falling back to in-memory storage for this session.`,
    error,
  );
}

function runStorageOperation<T>(
  operationName: string,
  operation: (adapter: StorageAdapter) => T,
  fallbackValue: T,
  key?: string,
) {
  try {
    return operation(storageRuntimeState.activeAdapter);
  } catch (error) {
    fallbackToMemoryStorage(error, operationName, key);

    try {
      return operation(storageRuntimeState.activeAdapter);
    } catch {
      return fallbackValue;
    }
  }
}

export const storage = {
  clearAll: () => runStorageOperation('clearAll', (adapter) => adapter.clearAll(), undefined),
  getBoolean: (key: string) =>
    runStorageOperation('getBoolean', (adapter) => adapter.getBoolean(key), undefined, key),
  getNumber: (key: string) =>
    runStorageOperation('getNumber', (adapter) => adapter.getNumber(key), undefined, key),
  getString: (key: string) =>
    runStorageOperation('getString', (adapter) => adapter.getString(key), undefined, key),
  remove: (key: string) => runStorageOperation('remove', (adapter) => adapter.remove(key), undefined, key),
  set: (key: string, value: StorageValue) =>
    runStorageOperation('set', (adapter) => adapter.set(key, value), undefined, key),
};

export function isPersistentStorageAvailable() {
  return Boolean(storageRuntimeState.mmkvAdapter && !storageRuntimeState.isUsingFallbackStorage);
}

export const storageService = {
  clear: () => storage.clearAll(),
  getBoolean: (key: string) => storage.getBoolean(key),
  getNumber: (key: string) => storage.getNumber(key),
  getString: (key: string) => storage.getString(key),
  remove: (key: string) => storage.remove(key),
  set: (key: string, value: StorageValue) => storage.set(key, value),
};
