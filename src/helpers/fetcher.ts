import { AppException, AppExceptionCode } from "./exceptions.js";

/**
 * Static API base URL and endpoint builders.
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  if (entries.length === 0) return "";
  const search = entries
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  return `?${search}`;
}

/** Default Moosyl API base URL. */
export const DEFAULT_BASE_URL = "https://api.moosyl.com";

/** Default request timeout (ms). Requests taking longer fail with code `timeout`. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Options shared by the client, its services and the fetcher.
 */
export interface ClientOptions {
  /** API base URL. Defaults to `https://api.moosyl.com`. Trailing slashes are ignored. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 60 000. */
  timeoutMs?: number;
}

/** Builds the endpoint URLs for a given base URL. */
export function createEndpoints(baseUrl: string = DEFAULT_BASE_URL) {
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),

    paymentMethods(isTestingMode?: boolean): string {
      return `${this.baseUrl}/configuration${buildQueryString({ isTestingMode })}`;
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

    paymentStatus(id: string): string {
      return `${this.baseUrl}/payment/${encodeURIComponent(id)}/status`;
    },

    simulateTransfer(id: string): string {
      return `${this.baseUrl}/payment/${encodeURIComponent(id)}/simulate-transfer`;
    },

    get checkoutSession(): string {
      return `${this.baseUrl}/checkout-session`;
    },

    // Products
    products(query?: Record<string, unknown>): string {
      return `${this.baseUrl}/products${buildQueryString(query)}`;
    },
    product(id: string): string {
      return `${this.baseUrl}/products/${id}`;
    },
    archiveProduct(id: string): string {
      return `${this.baseUrl}/products/${id}/archive`;
    },

    // Customers
    customers(query?: Record<string, unknown>): string {
      return `${this.baseUrl}/customers${buildQueryString(query)}`;
    },
    customer(id: string): string {
      return `${this.baseUrl}/customers/${id}`;
    },

    // Subscriptions
    subscriptions(query?: Record<string, unknown>): string {
      return `${this.baseUrl}/subscriptions${buildQueryString(query)}`;
    },
    subscription(id: string): string {
      return `${this.baseUrl}/subscriptions/${id}`;
    },
    subscriptionByExternalUserCreate(): string {
      return `${this.baseUrl}/subscriptions/by-external-user`;
    },
    subscriptionByExternalUser(externalUserId: string): string {
      return `${this.baseUrl}/subscriptions/by-external-user/${externalUserId}`;
    },
    cancelSubscription(id: string): string {
      return `${this.baseUrl}/subscriptions/${id}/cancel`;
    },

    // Invoices
    invoices(query?: Record<string, unknown>): string {
      return `${this.baseUrl}/invoices${buildQueryString(query)}`;
    },
  };
}

/** Endpoint URLs for the default base URL (kept for backward compatibility). */
export const Endpoints = createEndpoints();

function parseResponseBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/**
 * HTTP client for Moosyl API. Sends GET/POST/PATCH with the API key as the raw
 * `Authorization` header. Every request is aborted after `timeoutMs`
 * (default 60 s). Uses `AbortController` + `setTimeout` rather than
 * `AbortSignal.timeout`, which React Native does not implement.
 */
export class Fetcher {
  publishableApiKey: string;
  readonly timeoutMs: number;

  constructor(publishableApiKey: string, options: ClientOptions = {}) {
    this.publishableApiKey = publishableApiKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
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

  private wrapFetchError(err: unknown, timedOut: boolean): AppException {
    if (timedOut) {
      return new AppException({
        code: AppExceptionCode.timeout,
        message: "Request timed out",
      });
    }
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

  private async request(
    method: "GET" | "POST" | "PATCH",
    url: string,
    body?: Record<string, unknown>,
    raw = false
  ): Promise<FetcherResponse> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const res = await this.fromResponse(response, raw);
      if (!res.success) throw res.toException();
      return res;
    } catch (err) {
      if (err instanceof AppException) throw err;
      throw this.wrapFetchError(err, timedOut);
    } finally {
      clearTimeout(timer);
    }
  }

  async get(
    url: string,
    options: { raw?: boolean } = {}
  ): Promise<FetcherResponse> {
    return this.request("GET", url, undefined, options.raw ?? false);
  }

  async post(
    url: string,
    body?: Record<string, unknown>
  ): Promise<FetcherResponse> {
    return this.request("POST", url, body);
  }

  async patch(
    url: string,
    body?: Record<string, unknown>
  ): Promise<FetcherResponse> {
    return this.request("PATCH", url, body);
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
        : data &&
          typeof data === "object" &&
          (data as { code?: unknown }).code != null
        ? String((data as { code: unknown }).code)
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
