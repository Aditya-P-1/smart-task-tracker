import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'smart-task-habit-tracker',
});

export const storageService = {
  clear: () => storage.clearAll(),
  getBoolean: (key: string) => storage.getBoolean(key),
  getNumber: (key: string) => storage.getNumber(key),
  getString: (key: string) => storage.getString(key),
  remove: (key: string) => storage.remove(key),
  set: (key: string, value: boolean | number | string) => storage.set(key, value),
};
