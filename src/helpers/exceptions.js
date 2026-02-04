/**
 * Exception codes returned by the API or used internally.
 */
export const AppExceptionCode = {
  unknown: 'unknown',
  // Add other codes as needed when API contract is known
};

/**
 * Application exception with code and message.
 * Thrown when API requests fail.
 */
export class AppException extends Error {
  /**
   * @param {{ code: string; message: string }} options
   */
  constructor({ code, message }) {
    super(message);
    this.name = 'AppException';
    this.code = code ?? AppExceptionCode.unknown;
    this.message = message ?? 'An error occurred';
  }
}
