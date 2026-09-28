import { Fetcher, createEndpoints } from '../helpers/fetcher.js';
import type { ClientOptions } from '../helpers/fetcher.js';
import { PaymentRequestModel } from '../models/payment-request-model.js';

/**
 * Fetches Payment Request details by transaction ID.
 */
export class GetPaymentRequestService {
  constructor(
    public readonly authorizations: string,
    private readonly options: ClientOptions = {},
  ) {}

  private get endpoints() {
    return createEndpoints(this.options.baseUrl);
  }

  async get(transactionId: string): Promise<PaymentRequestModel> {
    const result = await new Fetcher(this.authorizations, this.options).get(
      this.endpoints.paymentRequest(transactionId)
    );
    const data = result.data as { data?: Record<string, unknown> } | Record<string, unknown> | undefined;
    const payload = data && typeof data === 'object' && 'data' in data ? data.data : data;
    return PaymentRequestModel.fromMap(
      typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {}
    );
  }
}
