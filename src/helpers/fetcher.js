import { AppException, AppExceptionCode } from './exceptions.js';

/**
 * Static API base URL and endpoint builders.
 */
export const Endpoints = {
  baseUrl: 'https://moosyl.moosyl.workers.dev',

  /** @param {boolean} isTestingMode */
  paymentMethods(isTestingMode) {
    return `${this.baseUrl}/configuration?isTestingMode=${isTestingMode}`;
  },

  get pay() {
    return `${this.baseUrl}/payment`;
  },

  get manualPayment() {
    return `${this.baseUrl}/payment/manual`;
  },

  /** @param {string} id */
  paymentRequest(id) {
    return `${this.baseUrl}/payment-request/by-transaction/${id}`;
  },
};

/**
 * Converts raw HTTP response body to JSON when possible.
 * @param {string} body
 * @returns {unknown}
 */
function parseResponseBody(body) {
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
  /**
   * @param {string} publishableApiKey - API key for Authorization header
   */
  constructor(publishableApiKey) {
    this.publishableApiKey = publishableApiKey;
  }

  /** @returns {Record<string, string>} */
  get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.publishableApiKey,
    };
  }

  /**
   * @param {Response} response
   * @param {boolean} [bytes]
   * @returns {Promise<FetcherResponse>}
   */
  static async fromResponse(response, bytes = false) {
    const url = response.url ?? '';
    const status = response.status;
    const body = await response.text();
    const data = bytes ? body : parseResponseBody(body);
    return new FetcherResponse({ url, status, data });
  }

  /**
   * GET request.
   * @param {string} url
   * @param {{ bytes?: boolean }} [options]
   * @returns {Promise<FetcherResponse>}
   */
  async get(url, { bytes = false } = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
      signal: AbortSignal.timeout(60_000),
    });
    const res = await Fetcher.fromResponse(response, bytes);
    if (!res.success) throw res.toException();
    return res;
  }

  /**
   * POST request with JSON body.
   * @param {string} url
   * @param {Record<string, unknown>} [body]
   * @returns {Promise<FetcherResponse>}
   */
  async post(url, body) {
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

  /**
   * POST multipart with fields and files.
   * @param {string} url
   * @param {Record<string, string>} body
   * @param {{ name: string; data: Buffer | Blob; filename?: string }[]} [files]
   * @returns {Promise<FetcherResponse>}
   */
  async multipartPost(url, body, files = []) {
    const form = new FormData();
    for (const [key, value] of Object.entries(body)) {
      form.append(key, value);
    }
    for (const file of files) {
      form.append('attachments', file.data, file.filename ?? file.name);
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
  /**
   * @param {{ url: string; status: number; data: unknown }} options
   */
  constructor({ url, status, data }) {
    this.url = url;
    this.status = status;
    this.data = data;
  }

  get success() {
    return this.status >= 200 && this.status <= 299;
  }

  /** @returns {string} */
  stripHtmlIfNeeded(text) {
    return String(text).replace(/<[^>]*>|&[^;]+;/g, ' ');
  }

  /** @returns {AppException} */
  toException() {
    const code =
      typeof this.data === 'string'
        ? this.data
        : (this.data && typeof this.data === 'object' && 'code' in this.data
            ? this.data.code
            : AppExceptionCode.unknown);
    const message =
      typeof this.data === 'string'
        ? this.data
        : (this.data && typeof this.data === 'object' && 'message' in this.data
            ? this.data.message
            : 'An error occurred');
    return new AppException({ code, message: String(message) });
  }
}
