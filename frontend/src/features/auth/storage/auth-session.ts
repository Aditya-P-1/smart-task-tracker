import { STORAGE_KEYS } from '../../../constants/storage-keys';
import { resetAppQueryCache } from '../../../providers/query-provider';
import { storageService } from '../../../storage/mmkv';

import type { AuthUser, LoginResult } from '../types/auth';

export function getAuthToken() {
  return storageService.getString(STORAGE_KEYS.accessToken) ?? null;
}

export function hasActiveSession() {
  return Boolean(getAuthToken() && getStoredAuthUser());
}

export function getStoredAuthUser() {
  const rawUser = storageService.getString(STORAGE_KEYS.authUser);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: LoginResult) {
  storageService.remove(STORAGE_KEYS.taskListCache);
  storageService.set(STORAGE_KEYS.accessToken, session.token);
  storageService.set(STORAGE_KEYS.authUser, JSON.stringify(session.user));
}

export function clearAuthSession() {
  storageService.remove(STORAGE_KEYS.accessToken);
  storageService.remove(STORAGE_KEYS.authUser);
  storageService.remove(STORAGE_KEYS.taskListCache);
  resetAppQueryCache();
}
