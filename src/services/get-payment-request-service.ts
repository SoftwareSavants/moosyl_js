import { Fetcher, Endpoints } from '../helpers/fetcher.js';
import { PaymentRequestModel } from '../models/payment-request-model.js';

/**
 * Fetches Payment Request details by transaction ID.
 */
export class GetPaymentRequestService {
  constructor(public readonly authorizations: string) {}

  async get(transactionId: string): Promise<PaymentRequestModel> {
    const result = await new Fetcher(this.authorizations).get(
      Endpoints.paymentRequest(transactionId)
    );
    const data = result.data as { data?: Record<string, unknown> } | Record<string, unknown> | undefined;
    const payload = data && typeof data === 'object' && 'data' in data ? data.data : data;
    return PaymentRequestModel.fromMap(
      typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {}
    );
  }
}
