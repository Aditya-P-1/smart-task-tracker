import axios, { AxiosHeaders } from 'axios';

import { env } from '../config/env';
import { storage } from '../storage/mmkv';

const ACCESS_TOKEN_KEY = 'accessToken';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = storage.getString(ACCESS_TOKEN_KEY);
  const headers = AxiosHeaders.from(config.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  config.headers = headers;

  return config;
});
