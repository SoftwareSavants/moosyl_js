import { Fetcher, createEndpoints, FetcherResponse } from "../helpers/fetcher.js";
import type { ClientOptions } from "../helpers/fetcher.js";
import {
  PayParams,
  PayResult,
  payResultFromMap,
  unwrapPaymentBody,
} from "../models/payment-model.js";

/**
 * Service for processing payments via the Moosyl API.
 */
export class PayService {
  constructor(
    public readonly publishableApiKey: string,
    private readonly options: ClientOptions = {},
  ) {}

  private get endpoints() {
    return createEndpoints(this.options.baseUrl);
  }

  /** Sends `POST /payment`; `passCode` is left out of the body when undefined. */
  async create(params: PayParams): Promise<FetcherResponse> {
    const body: Record<string, unknown> = {
      transactionId: params.transactionId,
      phoneNumber: params.phoneNumber,
      configurationId: params.configurationId,
    };
    if (params.passCode !== undefined) body.passCode = params.passCode;
    return new Fetcher(this.publishableApiKey, this.options).post(
      this.endpoints.pay,
      body,
    );
  }

  /** Creates a payment and returns it typed, including Gimtel `instructions`. */
  async payTyped(params: PayParams): Promise<PayResult> {
    const response = await this.create(params);
    return payResultFromMap(unwrapPaymentBody(response.data));
  }

  /** Legacy positional form; returns the raw response. */
  async pay(
    transactionId: string,
    phoneNumber: string,
    passCode: string | undefined,
    paymentMethodId: string,
  ): Promise<FetcherResponse> {
    return this.create({
      transactionId,
      phoneNumber,
      passCode,
      configurationId: paymentMethodId,
    });
  }
}
