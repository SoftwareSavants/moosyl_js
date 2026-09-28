import { Fetcher, createEndpoints, FetcherResponse } from "../helpers/fetcher.js";
import type { ClientOptions } from "../helpers/fetcher.js";

/**
 * Fetches a single payment by ID. Returns the raw API response (FetcherResponse).
 */
export class GetPaymentService {
  constructor(
    public readonly publishableApiKey: string,
    private readonly options: ClientOptions = {},
  ) {}

  private get endpoints() {
    return createEndpoints(this.options.baseUrl);
  }

  async get(paymentId: string): Promise<FetcherResponse> {
    return new Fetcher(this.publishableApiKey, this.options).get(
      this.endpoints.getPayment(paymentId),
    );
  }
}
