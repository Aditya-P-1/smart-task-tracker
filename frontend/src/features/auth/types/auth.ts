export type AuthUser = {
  createdAt: string;
  email: string;
  id: string;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  name: string;
  updatedAt: string;
};

export type SignupPayload = {
  email: string;
  name: string;
  password: string;
};

export type SignupVerification = {
  createdNewUser: boolean;
  emailSent: boolean;
  expiresAt: string;
  message?: string;
  previewUrl?: string;
  token?: string;
};

export type SignupResult = {
  createdNewUser: boolean;
  user: AuthUser;
  verification: SignupVerification;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};

export type VerifyEmailResult = {
  alreadyVerified: boolean;
  user: AuthUser;
};

export type SignupFormValues = SignupPayload;
export type LoginFormValues = LoginPayload;
