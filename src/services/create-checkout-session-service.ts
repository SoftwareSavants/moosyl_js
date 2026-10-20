import { createEndpoints, Fetcher } from "../helpers/fetcher.js";
import type { ClientOptions } from "../helpers/fetcher.js";
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from "../models/checkout-session-model.js";

export class CreateCheckoutSessionService {
  constructor(
    public readonly secretApiKey: string,
    private readonly options: ClientOptions = {},
  ) {}

  private get endpoints() {
    return createEndpoints(this.options.baseUrl);
  }

  async create(
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    const result = await new Fetcher(this.secretApiKey, this.options).post(
      this.endpoints.checkoutSession,
      request as unknown as Record<string, unknown>
    );
    return CreateCheckoutSessionResponse.fromMap(
      typeof result.data === "object" && result.data !== null
        ? (result.data as Record<string, unknown>)
        : {}
    );
  }
}
