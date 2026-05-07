import axios from 'axios';

type ErrorDetails = Array<{
  field?: string;
  message?: string;
}>;

type ErrorResponse = {
  details?: ErrorDetails;
  message?: string;
};

export type NormalizedApiError = {
  details: string[];
  isNetworkError: boolean;
  message: string;
  statusCode: number | null;
};

export type GlobalApiErrorRecord = NormalizedApiError & {
  scope: 'mutation' | 'query' | 'request';
  source: string;
  timestamp: string;
};

const globalErrorListeners = new Set<(record: GlobalApiErrorRecord) => void>();

let latestGlobalApiError: GlobalApiErrorRecord | null = null;
let lastGlobalErrorSignature = '';
let lastGlobalErrorTimestamp = 0;

function readErrorDetails(responseData: ErrorResponse | undefined) {
  if (!Array.isArray(responseData?.details)) {
    return [];
  }

  return responseData.details
    .map((detail) => detail.message?.trim())
    .filter((message): message is string => Boolean(message));
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        details: [],
        isNetworkError: true,
        message:
          'We could not reach the backend. Check that the API server is running and that your device can access it.',
        statusCode: null,
      };
    }

    const responseData = error.response.data as ErrorResponse | undefined;
    const details = readErrorDetails(responseData);

    return {
      details,
      isNetworkError: false,
      message:
        responseData?.message ||
        details[0] ||
        error.message ||
        'The request could not be completed.',
      statusCode: error.response.status,
    };
  }

  if (error instanceof Error) {
    return {
      details: [],
      isNetworkError: false,
      message: error.message,
      statusCode: null,
    };
  }

  return {
    details: [],
    isNetworkError: false,
    message: 'The request could not be completed.',
    statusCode: null,
  };
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.details.length > 0) {
    return normalizedError.details.join('\n');
  }

  return normalizedError.message || fallbackMessage;
}

export function shouldRetryApiRequest(error: unknown, failureCount: number) {
  if (failureCount >= 2) {
    return false;
  }

  const normalizedError = normalizeApiError(error);

  if (normalizedError.isNetworkError) {
    return true;
  }

  if (normalizedError.statusCode === null) {
    return false;
  }

  return normalizedError.statusCode === 429 || normalizedError.statusCode >= 500;
}

export function getGlobalApiError() {
  return latestGlobalApiError;
}

export function clearGlobalApiError() {
  latestGlobalApiError = null;
}

export function subscribeToGlobalApiErrors(listener: (record: GlobalApiErrorRecord) => void) {
  globalErrorListeners.add(listener);

  return () => {
    globalErrorListeners.delete(listener);
  };
}

export function handleGlobalApiError(
  error: unknown,
  scope: GlobalApiErrorRecord['scope'],
  source: string,
) {
  const normalizedError = normalizeApiError(error);
  const signature = `${scope}:${source}:${normalizedError.statusCode ?? 'network'}:${normalizedError.message}`;
  const now = Date.now();

  if (lastGlobalErrorSignature === signature && now - lastGlobalErrorTimestamp < 2_000) {
    return;
  }

  lastGlobalErrorSignature = signature;
  lastGlobalErrorTimestamp = now;

  latestGlobalApiError = {
    ...normalizedError,
    scope,
    source,
    timestamp: new Date(now).toISOString(),
  };

  globalErrorListeners.forEach((listener) => {
    if (latestGlobalApiError) {
      listener(latestGlobalApiError);
    }
  });

  console.warn(`[${scope}] ${source}: ${normalizedError.message}`);
}
