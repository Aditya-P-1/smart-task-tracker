type StorageValue = boolean | number | string;

type StorageAdapter = {
  clearAll: () => void;
  getBoolean: (key: string) => boolean | undefined;
  getNumber: (key: string) => number | undefined;
  getString: (key: string) => string | undefined;
  remove: (key: string) => void;
  set: (key: string, value: StorageValue) => void;
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

function createStorageAdapter(): StorageAdapter {
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

    return createMemoryStorage();
  }
}

export const storage = createStorageAdapter();

export const storageService = {
  clear: () => storage.clearAll(),
  getBoolean: (key: string) => storage.getBoolean(key),
  getNumber: (key: string) => storage.getNumber(key),
  getString: (key: string) => storage.getString(key),
  remove: (key: string) => storage.remove(key),
  set: (key: string, value: StorageValue) => storage.set(key, value),
};
