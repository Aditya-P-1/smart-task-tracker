import { useMutation } from '@tanstack/react-query';

import { login, signup, verifyEmail } from '../api/auth';

export function useSignupMutation() {
  return useMutation({
    mutationKey: ['auth', 'signup'],
    mutationFn: signup,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: login,
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationKey: ['auth', 'verify-email'],
    mutationFn: verifyEmail,
  });
}
