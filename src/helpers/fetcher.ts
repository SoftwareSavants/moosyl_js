import { AppException, AppExceptionCode } from "./exceptions.js";

/**
 * Static API base URL and endpoint builders.
 */
export const Endpoints = {
  baseUrl: "https://api.moosyl.com",

  paymentMethods(isTestingMode: boolean): string {
    return `${this.baseUrl}/configuration?isTestingMode=${isTestingMode}`;
  },

  get pay(): string {
    return `${this.baseUrl}/payment`;
  },

  paymentRequest(id: string): string {
    return `${this.baseUrl}/payment-request/by-transaction/${id}`;
  },

  getPayment(id: string): string {
    return `${this.baseUrl}/payment/${id}`;
  },

  get checkoutSession(): string {
    return `${this.baseUrl}/checkout-session`;
  },
};

function parseResponseBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/**
 * HTTP client for Moosyl API. Sends GET/POST with auth header.
 */
export class Fetcher {
  publishableApiKey: string;

  constructor(publishableApiKey: string) {
    this.publishableApiKey = publishableApiKey;
  }

  get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: this.publishableApiKey,
    };
  }

  private async fromResponse(
    response: Response,
    raw = false
  ): Promise<FetcherResponse> {
    const url = response.url ?? "";
    const status = response.status;
    const body = await response.text();
    const data = raw ? body : parseResponseBody(body);
    return new FetcherResponse({ url, status, data });
  }

  private wrapFetchError(err: unknown): AppException {
    if (err instanceof Error) {
      const name = (err as Error & { name?: string }).name;
      if (name === "AbortError") {
        return new AppException({
          code: AppExceptionCode.abortError,
          message: err.message || "Request was aborted",
        });
      }
      if (name === "TimeoutError") {
        return new AppException({
          code: AppExceptionCode.timeout,
          message: err.message || "Request timed out",
        });
      }
      return new AppException({
        code: AppExceptionCode.connectionError,
        message: err.message || "Network request failed",
      });
    }
    return new AppException({
      code: AppExceptionCode.connectionError,
      message: "Network request failed",
    });
  }

  async get(
    url: string,
    options: { raw?: boolean } = {}
  ): Promise<FetcherResponse> {
    const { raw = false } = options;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.headers,
        signal: AbortSignal.timeout(60_000),
      });
      const res = await this.fromResponse(response, raw);
      if (!res.success) throw res.toException();
      return res;
    } catch (err) {
      if (err instanceof AppException) throw err;
      throw this.wrapFetchError(err);
    }
  }

  async post(
    url: string,
    body?: Record<string, unknown>
  ): Promise<FetcherResponse> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60_000),
      });
      const res = await this.fromResponse(response);
      if (!res.success) throw res.toException();
      return res;
    } catch (err) {
      if (err instanceof AppException) throw err;
      throw this.wrapFetchError(err);
    }
  }
}

/**
 * Wrapper for API response (url, status, data).
 */
export class FetcherResponse {
  readonly url: string;
  readonly status: number;
  readonly data: unknown;

  constructor(options: { url: string; status: number; data: unknown }) {
    this.url = options.url;
    this.status = options.status;
    this.data = options.data;
  }

  get success(): boolean {
    return this.status >= 200 && this.status <= 299;
  }

  stripHtmlIfNeeded(text: string): string {
    return String(text).replace(/<[^>]*>|&[^;]+;/g, " ");
  }

  toException(): AppException {
    const data = this.data;
    const code =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "code" in data
        ? (data as { code: string }).code
        : AppExceptionCode.unknown;
    const message =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : "An error occurred";
    return new AppException({
      code,
      message: String(message),
      status: this.status,
    });
  }
}
