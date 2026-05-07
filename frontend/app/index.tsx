import { Redirect } from 'expo-router';

import { hasActiveSession } from '../src/features/auth/storage/auth-session';

export default function IndexScreen() {
  return <Redirect href={hasActiveSession() ? '/(tabs)' : '/auth/login'} />;
}
