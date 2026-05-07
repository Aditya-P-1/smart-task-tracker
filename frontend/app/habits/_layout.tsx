import { Redirect, Stack } from 'expo-router';

import { hasActiveSession } from '../../src/features/auth/storage/auth-session';

export default function HabitStackLayout() {
  if (!hasActiveSession()) {
    return <Redirect href="/auth/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
