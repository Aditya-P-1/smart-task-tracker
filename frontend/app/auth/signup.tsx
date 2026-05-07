import { Link, Redirect, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { normalizeLocalhostUrlForPlatform } from '../../src/config/env';
import { AuthScreenShell } from '../../src/features/auth/components/auth-screen-shell';
import { AuthStatusCard } from '../../src/features/auth/components/auth-status-card';
import { AuthSubmitButton } from '../../src/features/auth/components/auth-submit-button';
import { AuthTextField } from '../../src/features/auth/components/auth-text-field';
import { useSignupMutation } from '../../src/features/auth/hooks/use-auth-mutations';
import { hasActiveSession } from '../../src/features/auth/storage/auth-session';
import type { SignupFormValues, SignupResult } from '../../src/features/auth/types/auth';
import { getApiErrorMessage } from '../../src/features/auth/utils/api-error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
    mode: 'onBlur',
  });
  const signupMutation = useSignupMutation();
  const signupResult = signupMutation.data ?? null;

  if (hasActiveSession()) {
    return <Redirect href="/(tabs)" />;
  }

  const submitSignup = handleSubmit(async (values) => {
    const result = await signupMutation.mutateAsync(values);
    reset({
      email: result.user.email,
      name: result.user.name,
      password: '',
    });
  });

  return (
    <AuthScreenShell
      eyebrow="Create Account"
      title="Start your habit system"
      description="Set up your account now. The backend will send a verification email before login is allowed."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered?</Text>
          <Link href="/auth/login" style={styles.footerLink}>
            Log in
          </Link>
        </View>
      }
    >
      <View style={styles.form}>
        {signupMutation.isError ? (
          <AuthStatusCard
            tone="error"
            title="Signup failed"
            description={getApiErrorMessage(
              signupMutation.error,
              'We could not create your account. Please check the form and try again.',
            )}
          />
        ) : null}
        {signupResult ? <SignupSuccessState result={signupResult} onOpenVerification={(token) => router.push(`/auth/verify-email/${token}`)} /> : null}
        <AuthTextField
          control={control}
          name="name"
          label="Full name"
          placeholder="Aditya Kumar"
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
          error={errors.name?.message}
          rules={{
            maxLength: {
              message: 'Name must be 60 characters or fewer.',
              value: 60,
            },
            minLength: {
              message: 'Name must be at least 2 characters.',
              value: 2,
            },
            required: 'Name is required.',
          }}
        />
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
          placeholder="Create a strong password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password?.message}
          rules={{
            maxLength: {
              message: 'Password must be 128 characters or fewer.',
              value: 128,
            },
            minLength: {
              message: 'Password must be at least 8 characters.',
              value: 8,
            },
            required: 'Password is required.',
            validate: (value) =>
              value.trim().length > 0 || 'Password cannot be only spaces.',
          }}
        />
        <AuthSubmitButton
          label="Create Account"
          loadingLabel="Creating Account..."
          isLoading={signupMutation.isPending}
          onPress={() => {
            void submitSignup();
          }}
        />
      </View>
      {signupResult ? (
        <View style={styles.followUp}>
          <AuthSubmitButton
            label="I Verified My Email"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/auth/verification-success',
                params: { email: signupResult.user.email },
              })
            }
          />
        </View>
      ) : null}
    </AuthScreenShell>
  );
}

function SignupSuccessState({
  onOpenVerification,
  result,
}: {
  onOpenVerification: (token: string) => void;
  result: SignupResult;
}) {
  return (
    <AuthStatusCard
      tone="success"
      title={result.createdNewUser ? 'Verification email sent' : 'Verification email resent'}
      description={result.verification.message ?? 'Check your inbox and verify your email before logging in.'}
    >
      <Text style={styles.detailLabel}>Sent to</Text>
      <Text style={styles.detailValue}>{result.user.email}</Text>
      {result.verification.token ? (
        <AuthSubmitButton
          label="Open Verification Link"
          variant="ghost"
          onPress={() => {
            onOpenVerification(result.verification.token as string);
          }}
        />
      ) : result.verification.previewUrl ? (
        <AuthSubmitButton
          label="Open Verification Link"
          variant="ghost"
          onPress={() => {
            void Linking.openURL(
              normalizeLocalhostUrlForPlatform(result.verification.previewUrl as string),
            );
          }}
        />
      ) : null}
      {result.verification.token ? (
        <View style={styles.tokenBlock}>
          <Text style={styles.tokenLabel}>Development verification token</Text>
          <Text selectable style={styles.tokenValue}>
            {result.verification.token}
          </Text>
        </View>
      ) : null}
    </AuthStatusCard>
  );
}

const styles = StyleSheet.create({
  detailLabel: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  followUp: {
    marginTop: 16,
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
  form: {
    gap: 16,
  },
  tokenBlock: {
    backgroundColor: '#ecfeff',
    borderColor: '#99f6e4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  tokenLabel: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tokenValue: {
    color: '#134e4a',
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 20,
  },
});
