import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthScreenShell } from '../../../src/features/auth/components/auth-screen-shell';
import { AuthStatusCard } from '../../../src/features/auth/components/auth-status-card';
import { AuthSubmitButton } from '../../../src/features/auth/components/auth-submit-button';
import { useVerifyEmailMutation } from '../../../src/features/auth/hooks/use-auth-mutations';
import type { VerifyEmailResult } from '../../../src/features/auth/types/auth';
import { getApiErrorMessage } from '../../../src/features/auth/utils/api-error';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const verifyEmailMutation = useVerifyEmailMutation();
  const hasTriggeredRef = useRef(false);
  const token = typeof params.token === 'string' ? params.token : '';

  useEffect(() => {
    if (!token || hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;

    verifyEmailMutation.mutate(token, {
      onSuccess: (result: VerifyEmailResult) => {
        router.replace({
          pathname: '/auth/verification-success',
          params: {
            email: result.user.email,
            alreadyVerified: result.alreadyVerified ? 'true' : 'false',
          },
        });
      },
    });
  }, [router, token, verifyEmailMutation]);

  return (
    <AuthScreenShell
      eyebrow="Verifying Email"
      title="Checking your verification link"
      description="Please wait while we confirm your email address with the backend."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Need another account?</Text>
          <Link href="/auth/signup" style={styles.footerLink}>
            Sign up
          </Link>
        </View>
      }
    >
      {!token ? (
        <AuthStatusCard
          tone="error"
          title="Missing verification token"
          description="The verification link is incomplete. Please request a new signup verification email."
        />
      ) : verifyEmailMutation.isError ? (
        <AuthStatusCard
          tone="error"
          title="Verification failed"
          description={getApiErrorMessage(
            verifyEmailMutation.error,
            'We could not verify this email link. It may be invalid or expired.',
          )}
        >
          <AuthSubmitButton
            label="Back to Signup"
            variant="secondary"
            onPress={() => {
              router.replace('/auth/signup');
            }}
          />
        </AuthStatusCard>
      ) : (
        <AuthStatusCard
          tone="success"
          title="Verifying your account"
          description="We are confirming your email address. This usually takes only a moment."
        >
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#0f766e" />
            <Text style={styles.loaderText}>Talking to the backend...</Text>
          </View>
        </AuthStatusCard>
      )}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
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
  loaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loaderText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
});
