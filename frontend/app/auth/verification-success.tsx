import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreenShell } from '../../src/features/auth/components/auth-screen-shell';
import { AuthStatusCard } from '../../src/features/auth/components/auth-status-card';
import { AuthSubmitButton } from '../../src/features/auth/components/auth-submit-button';
import { hasActiveSession } from '../../src/features/auth/storage/auth-session';

export default function VerificationSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alreadyVerified?: string; email?: string }>();
  const alreadyVerified = params.alreadyVerified === 'true';

  if (hasActiveSession()) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <AuthScreenShell
      eyebrow="Email Verified"
      title="You are ready to log in"
      description="Once your email is verified on the backend, you can return here and continue into the app."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Want to create another account?</Text>
          <Link href="/auth/signup" style={styles.footerLink}>
            Go back
          </Link>
        </View>
      }
    >
      <AuthStatusCard
        tone="success"
        title={alreadyVerified ? 'Email already verified' : 'Verification complete'}
        description={
          alreadyVerified
            ? 'This account was already verified, so you can go straight to login.'
            : 'Your account can now be used to sign in.'
        }
      >
        {params.email ? (
          <View style={styles.emailBlock}>
            <Text style={styles.emailLabel}>Verified account</Text>
            <Text style={styles.emailValue}>{params.email}</Text>
          </View>
        ) : null}
        <AuthSubmitButton
          label="Continue to Login"
          onPress={() => {
            router.replace('/auth/login');
          }}
        />
      </AuthStatusCard>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  emailBlock: {
    backgroundColor: '#ecfeff',
    borderColor: '#99f6e4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  emailLabel: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emailValue: {
    color: '#134e4a',
    fontSize: 15,
    fontWeight: '600',
  },
  footerLink: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 15,
  },
});
