import { useMutation } from '@tanstack/react-query';

import { login, signup, verifyEmail } from '../api/auth';

export function useSignupMutation() {
  return useMutation({
    mutationFn: signup,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: verifyEmail,
  });
}
