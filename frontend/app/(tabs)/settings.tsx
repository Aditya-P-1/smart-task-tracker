import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenPlaceholder } from '../../src/components/common/screen-placeholder';
import { AuthSubmitButton } from '../../src/features/auth/components/auth-submit-button';
import { clearAuthSession, getStoredAuthUser } from '../../src/features/auth/storage/auth-session';

export default function SettingsScreen() {
  const router = useRouter();
  const currentUser = getStoredAuthUser();

  return (
    <ScreenPlaceholder
      title="Settings"
      description="App settings, preferences, and account flows can be organized here later."
    >
      <View style={styles.accountCard}>
        <Text style={styles.accountLabel}>Signed in as</Text>
        <Text style={styles.accountValue}>{currentUser?.email ?? 'Authenticated user'}</Text>
        <AuthSubmitButton
          label="Log Out"
          variant="secondary"
          onPress={() => {
            clearAuthSession();
            router.replace('/auth/login');
          }}
        />
      </View>
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 16,
  },
  accountLabel: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  accountValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
});
