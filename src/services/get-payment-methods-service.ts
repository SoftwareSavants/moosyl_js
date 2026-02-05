import { Fetcher, Endpoints } from "../helpers/fetcher.js";
import { PaymentMethod } from "../models/payment-method-model.js";

/**
 * Fetches available payment methods from the backend.
 */
export class GetPaymentMethodsService {
  constructor(public readonly publishableApiKey: string) {}

  async get(isTestingMode: boolean): Promise<PaymentMethod[]> {
    const result = await new Fetcher(this.publishableApiKey).get(
      Endpoints.paymentMethods(isTestingMode)
    );
    const data = result.data as { data?: unknown[] } | undefined;
    const list = Array.isArray(data?.data) ? data!.data : [];
    return list.map((e) =>
      PaymentMethod.fromPaymentType(e as Record<string, unknown>)
    );
  }
}
