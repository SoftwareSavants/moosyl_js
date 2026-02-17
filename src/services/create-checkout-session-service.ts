import { Endpoints, Fetcher } from "../helpers/fetcher.js";
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from "../models/checkout-session-model.js";

export class CreateCheckoutSessionService {
  constructor(public readonly secretApiKey: string) {}

  async create(
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    const result = await new Fetcher(this.secretApiKey).post(
      Endpoints.checkoutSession,
      request as unknown as Record<string, unknown>
    );
    return CreateCheckoutSessionResponse.fromMap(
      typeof result.data === "object" && result.data !== null
        ? (result.data as Record<string, unknown>)
        : {}
    );
  }
}
