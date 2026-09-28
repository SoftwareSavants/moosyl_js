import { Fetcher, createEndpoints } from "../helpers/fetcher.js";
import type { ClientOptions } from "../helpers/fetcher.js";
import {
  PaymentMethod,
  isPaymentMethodType,
} from "../models/payment-method-model.js";

/**
 * Fetches available payment methods from the backend.
 */
export class GetPaymentMethodsService {
  constructor(
    public readonly publishableApiKey: string,
    private readonly options: ClientOptions = {},
  ) {}

  private get endpoints() {
    return createEndpoints(this.options.baseUrl);
  }

  /**
   * Lists payment methods. Entries whose `type` this SDK version does not know
   * are skipped (instead of failing the whole call), so newer backend methods
   * never break older apps.
   * @param isTestingMode - Sent as `?isTestingMode=`; omitted when undefined
   *   (the API key's environment decides).
   */
  async get(isTestingMode?: boolean): Promise<PaymentMethod[]> {
    const result = await new Fetcher(this.publishableApiKey, this.options).get(
      this.endpoints.paymentMethods(isTestingMode),
    );
    const data = result.data as { data?: unknown[] } | undefined;
    const list = Array.isArray(data?.data) ? data!.data : [];
    return list
      .filter(
        (e): e is Record<string, unknown> =>
          typeof e === "object" &&
          e !== null &&
          isPaymentMethodType((e as Record<string, unknown>).type),
      )
      .map((e) => PaymentMethod.fromMap(e));
  }
}
