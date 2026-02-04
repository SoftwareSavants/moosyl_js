import { Fetcher, Endpoints } from '../helpers/fetcher.js';
import { PaymentRequestModel } from '../models/payment-request-model.js';

/**
 * Fetches Payment Request details by transaction ID.
 */
export class GetPaymentRequestService {
  /**
   * @param {string} authorizations - API key for authentication
   */
  constructor(authorizations) {
    this.authorizations = authorizations;
  }

  /**
   * Fetches Payment Request details for the given transaction.
   * @param {string} transactionId
   * @returns {Promise<PaymentRequestModel>}
   */
  async get(transactionId) {
    const result = await new Fetcher(this.authorizations).get(
      Endpoints.paymentRequest(transactionId)
    );
    const data = result.data;
    const payload = data?.data ?? data;
    return PaymentRequestModel.fromMap(
      typeof payload === 'object' && payload !== null ? payload : {}
    );
  }
}
