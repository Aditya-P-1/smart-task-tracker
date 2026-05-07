import axios, { AxiosHeaders } from 'axios';

import { env } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { resetAppQueryCache } from '../providers/query-provider';
import { storage } from '../storage/mmkv';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = storage.getString(STORAGE_KEYS.accessToken);
  const headers = AxiosHeaders.from(config.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  config.headers = headers;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      storage.remove(STORAGE_KEYS.accessToken);
      storage.remove(STORAGE_KEYS.authUser);
      storage.remove(STORAGE_KEYS.habitListCache);
      storage.remove(STORAGE_KEYS.taskListCache);
      resetAppQueryCache();
    }

    return Promise.reject(error);
  },
);
