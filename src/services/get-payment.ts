import { Fetcher, Endpoints, FetcherResponse } from "../helpers/fetcher.js";

/**
 * Fetches a single payment by ID. Returns the raw API response (FetcherResponse).
 */
export class GetPaymentService {
  constructor(public readonly publishableApiKey: string) {}

  async get(paymentId: string): Promise<FetcherResponse> {
    return new Fetcher(this.publishableApiKey).get(
      Endpoints.getPayment(paymentId),
    );
  }
}
