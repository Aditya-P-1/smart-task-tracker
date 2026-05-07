import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

import { getStoredAuthUser, hasActiveSession } from '../../src/features/auth/storage/auth-session';
import { prefetchAuthenticatedData } from '../../src/query/prefetch-authenticated-data';

export default function TabsLayout() {
  const hasSession = hasActiveSession();

  useEffect(() => {
    if (hasSession && getStoredAuthUser()?.id) {
      void prefetchAuthenticatedData();
    }
  }, [hasSession]);

  if (!hasSession) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#2563eb',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
