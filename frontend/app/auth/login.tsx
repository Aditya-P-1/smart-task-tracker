import { Redirect, Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreenShell } from '../../src/features/auth/components/auth-screen-shell';
import { AuthStatusCard } from '../../src/features/auth/components/auth-status-card';
import { AuthSubmitButton } from '../../src/features/auth/components/auth-submit-button';
import { AuthTextField } from '../../src/features/auth/components/auth-text-field';
import { useLoginMutation } from '../../src/features/auth/hooks/use-auth-mutations';
import { hasActiveSession, saveAuthSession } from '../../src/features/auth/storage/auth-session';
import type { LoginFormValues } from '../../src/features/auth/types/auth';
import { prefetchAuthenticatedData } from '../../src/query/prefetch-authenticated-data';
import { getApiErrorMessage } from '../../src/features/auth/utils/api-error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });
  const loginMutation = useLoginMutation();

  if (hasActiveSession()) {
    return <Redirect href="/(tabs)" />;
  }

  const submitLogin = handleSubmit(async (values) => {
    const result = await loginMutation.mutateAsync(values);
    saveAuthSession(result);
    void prefetchAuthenticatedData();
    router.replace('/(tabs)');
  });

  return (
    <AuthScreenShell
      eyebrow="Welcome Back"
      title="Log in to your tracker"
      description="Use your verified account to continue into the Smart Task & Habit Tracker app."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Need an account?</Text>
          <Link href="/auth/signup" style={styles.footerLink}>
            Create one
          </Link>
        </View>
      }
    >
      <View style={styles.form}>
        {loginMutation.isError ? (
          <AuthStatusCard
            tone="error"
            title="Login failed"
            description={getApiErrorMessage(
              loginMutation.error,
              'We could not log you in. Please check your details and try again.',
            )}
          />
        ) : null}
        <AuthTextField
          control={control}
          name="email"
          label="Email address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email?.message}
          rules={{
            pattern: {
              message: 'Enter a valid email address.',
              value: EMAIL_PATTERN,
            },
            required: 'Email is required.',
          }}
        />
        <AuthTextField
          control={control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          error={errors.password?.message}
          rules={{
            required: 'Password is required.',
          }}
        />
        <AuthSubmitButton
          label="Log In"
          loadingLabel="Logging In..."
          isLoading={loginMutation.isPending}
          onPress={() => {
            void submitLogin();
          }}
        />
        <Text style={styles.helperText}>
          If login fails because your email is not verified, open the verification link from signup first.
        </Text>
      </View>
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
  form: {
    gap: 16,
  },
  helperText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
  },
});
