import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = '5000';
const DEFAULT_WEB_API_URL = `http://localhost:${DEFAULT_API_PORT}/api/v1`;

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export function normalizeLocalhostUrlForPlatform(url: string) {
  if (Platform.OS !== 'android') {
    return url;
  }

  return url.replace('http://localhost', 'http://10.0.2.2').replace(
    'http://127.0.0.1',
    'http://10.0.2.2',
  );
}

function getExpoHostApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  const [host] = hostUri.split(':');

  if (!host) {
    return null;
  }

  return `http://${host}:${DEFAULT_API_PORT}/api/v1`;
}

function resolveApiUrl() {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return trimTrailingSlash(normalizeLocalhostUrlForPlatform(configuredApiUrl));
  }

  if (Platform.OS === 'web') {
    return DEFAULT_WEB_API_URL;
  }

  return trimTrailingSlash(
    normalizeLocalhostUrlForPlatform(getExpoHostApiUrl() ?? DEFAULT_WEB_API_URL),
  );
}

export const env = Object.freeze({
  apiUrl: resolveApiUrl(),
});
