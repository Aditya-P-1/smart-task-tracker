import axios from 'axios';

type ErrorDetails = Array<{
  field?: string;
  message?: string;
}>;

type ErrorResponse = {
  details?: ErrorDetails;
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'We could not reach the backend. Check that the API server is running and that your device can access it.';
    }

    const responseData = error.response?.data as ErrorResponse | undefined;

    if (Array.isArray(responseData?.details) && responseData.details.length > 0) {
      return responseData.details
        .map((detail) => detail.message)
        .filter(Boolean)
        .join('\n');
    }

    if (responseData?.message) {
      return responseData.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
