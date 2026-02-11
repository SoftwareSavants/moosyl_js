import { Fetcher, Endpoints, FetcherResponse } from "../helpers/fetcher.js";

export type ManualPayImageInput =
  | File
  | { name: string; data: Buffer | Uint8Array | ArrayBuffer; type?: string };

/**
 * Service for processing payments via the Moosyl API.
 */
export class PayService {
  constructor(public readonly publishableApiKey: string) {}

  async pay(
    transactionId: string,
    phoneNumber: string,
    passCode: string,
    paymentMethodId: string,
  ): Promise<FetcherResponse> {
    const response = await new Fetcher(this.publishableApiKey).post(
      Endpoints.pay,
      {
        transactionId,
        phoneNumber,
        passCode,
        configurationId: paymentMethodId,
      },
    );
    return response;
  }
}
