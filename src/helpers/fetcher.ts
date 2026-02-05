import { AppException, AppExceptionCode } from './exceptions.js';

/**
 * Static API base URL and endpoint builders.
 */
export const Endpoints = {
  baseUrl: 'https://moosyl.moosyl.workers.dev',

  paymentMethods(isTestingMode: boolean): string {
    return `${this.baseUrl}/configuration?isTestingMode=${isTestingMode}`;
  },

  get pay(): string {
    return `${this.baseUrl}/payment`;
  },

  get manualPayment(): string {
    return `${this.baseUrl}/payment/manual`;
  },

  paymentRequest(id: string): string {
    return `${this.baseUrl}/payment-request/by-transaction/${id}`;
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
      'Content-Type': 'application/json',
      Authorization: this.publishableApiKey,
    };
  }

  static async fromResponse(response: Response, bytes = false): Promise<FetcherResponse> {
    const url = response.url ?? '';
    const status = response.status;
    const body = await response.text();
    const data = bytes ? body : parseResponseBody(body);
    return new FetcherResponse({ url, status, data });
  }

  async get(url: string, options: { bytes?: boolean } = {}): Promise<FetcherResponse> {
    const { bytes = false } = options;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
      signal: AbortSignal.timeout(60_000),
    });
    const res = await Fetcher.fromResponse(response, bytes);
    if (!res.success) throw res.toException();
    return res;
  }

  async post(url: string, body?: Record<string, unknown>): Promise<FetcherResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60_000),
    });
    const res = await Fetcher.fromResponse(response);
    if (!res.success) throw res.toException();
    return res;
  }

  async multipartPost(
    url: string,
    body: Record<string, string>,
    files: { name: string; data: Buffer | Blob; filename?: string }[] = []
  ): Promise<FetcherResponse> {
    const form = new FormData();
    for (const [key, value] of Object.entries(body)) {
      form.append(key, value);
    }
    for (const file of files) {
      const blob =
        file.data instanceof Blob ? file.data : new Blob([new Uint8Array(file.data)]);
      form.append('attachments', blob, file.filename ?? file.name);
    }
    const headers = { Authorization: this.publishableApiKey };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const res = await Fetcher.fromResponse(response);
    if (!res.success) throw res.toException();
    return res;
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
    return String(text).replace(/<[^>]*>|&[^;]+;/g, ' ');
  }

  toException(): AppException {
    const data = this.data;
    const code =
      typeof data === 'string'
        ? data
        : (data && typeof data === 'object' && 'code' in data
            ? (data as { code: string }).code
            : AppExceptionCode.unknown);
    const message =
      typeof data === 'string'
        ? data
        : (data && typeof data === 'object' && 'message' in data
            ? (data as { message: string }).message
            : 'An error occurred');
    return new AppException({ code, message: String(message) });
  }
}
