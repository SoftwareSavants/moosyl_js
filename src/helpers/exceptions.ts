/**
 * Exception codes returned by the API or used internally.
 */
export const AppExceptionCode = {
  unknown: 'unknown',
} as const;

export type AppExceptionCodeType = (typeof AppExceptionCode)[keyof typeof AppExceptionCode];

/**
 * Application exception with code and message.
 * Thrown when API requests fail.
 */
export class AppException extends Error {
  code: string;
  override message: string;

  constructor(options: { code?: string; message?: string }) {
    const message = options.message ?? 'An error occurred';
    super(message);
    this.name = 'AppException';
    this.code = options.code ?? AppExceptionCode.unknown;
    this.message = message;
  }
}
