import { AxiosError } from "axios";

/**
 * Retry logic for failed API calls with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any) => boolean;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options || {};

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // If it's the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate wait time with exponential backoff
      const waitTime = delayMs * Math.pow(backoffMultiplier, attempt);

      console.warn(
        `⚠️ Attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`,
        (error as AxiosError)?.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Determine if an error should be retried
 */
function defaultShouldRetry(error: any): boolean {
  // Network errors
  if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
    return true;
  }

  // Server errors (5xx)
  if (error.response?.status >= 500) {
    return true;
  }

  // Too many requests
  if (error.response?.status === 429) {
    return true;
  }

  // Network timeout
  if (error.code === "ETIMEDOUT") {
    return true;
  }

  // Don't retry client errors (4xx except 429)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return false;
  }

  return false;
}
