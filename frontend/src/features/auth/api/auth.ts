import { apiClient } from '../../../api/client';

import type {
  ApiResponse,
  LoginPayload,
  LoginResult,
  SignupPayload,
  SignupResult,
  VerifyEmailResult,
} from '../types/auth';

export async function signup(payload: SignupPayload) {
  const response = await apiClient.post<ApiResponse<SignupResult>>('/auth/signup', payload);
  return response.data.data;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiResponse<LoginResult>>('/auth/login', payload);
  return response.data.data;
}

export async function verifyEmail(token: string) {
  const response = await apiClient.get<ApiResponse<VerifyEmailResult>>(`/auth/verify-email/${token}`);

  return response.data.data;
}
