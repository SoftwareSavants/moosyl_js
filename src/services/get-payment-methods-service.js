import { Fetcher, Endpoints } from '../helpers/fetcher.js';
import { PaymentMethod } from '../models/payment-method-model.js';

/**
 * Fetches available payment methods from the backend.
 */
export class GetPaymentMethodsService {
  /**
   * @param {string} publishableApiKey - API key for authentication
   */
  constructor(publishableApiKey) {
    this.publishableApiKey = publishableApiKey;
  }

  /**
   * Fetches the available payment methods.
   * @param {boolean} isTestingMode
   * @returns {Promise<PaymentMethod[]>}
   */
  async get(isTestingMode) {
    const result = await new Fetcher(this.publishableApiKey).get(
      Endpoints.paymentMethods(isTestingMode)
    );
    const data = result.data;
    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map((/** @type {Record<string, unknown>} */ e) =>
      PaymentMethod.fromPaymentType(e)
    );
  }
}
