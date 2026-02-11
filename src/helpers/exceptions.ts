/**
 * Exception codes returned by the API or used for request failures.
 */
export const AppExceptionCode = {
  unknown: "unknown",
  connectionError: "connection_error",
  abortError: "abort_error",
  timeout: "timeout",
  invalidApiKey: "invalid_api_key",
} as const;

export type AppExceptionCodeType =
  (typeof AppExceptionCode)[keyof typeof AppExceptionCode];

export interface AppExceptionOptions {
  code?: string;
  message?: string;
  status?: number;
}

/**
 * Application exception with code, message, and optional HTTP status.
 * Thrown when API requests fail (network, abort, timeout, or HTTP error response).
 */
export class AppException extends Error {
  code: string;
  override message: string;
  /** HTTP status when error comes from a response (e.g. 400, 500). */
  readonly status?: number;

  constructor(options: AppExceptionOptions = {}) {
    const message = options.message ?? "An error occurred";
    super(message);
    this.name = "AppException";
    this.code = options.code ?? AppExceptionCode.unknown;
    this.message = message;
    this.status = options.status;
  }

  get isConnectionError(): boolean {
    return this.code === AppExceptionCode.connectionError;
  }

  get isAbortError(): boolean {
    return this.code === AppExceptionCode.abortError;
  }

  get isTimeout(): boolean {
    return this.code === AppExceptionCode.timeout;
  }

  get isServerError(): boolean {
    return typeof this.status === "number" && this.status >= 500;
  }

  get isClientError(): boolean {
    return (
      typeof this.status === "number" && this.status >= 400 && this.status < 500
    );
  }

  /** True when the API rejected the request due to an invalid or missing API key. */
  get isInvalidApiKey(): boolean {
    return this.code === AppExceptionCode.invalidApiKey;
  }
}
