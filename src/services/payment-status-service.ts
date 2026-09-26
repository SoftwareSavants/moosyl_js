import { Fetcher, createEndpoints } from "../helpers/fetcher.js";
import type { ClientOptions } from "../helpers/fetcher.js";
import { AppException, AppExceptionCode } from "../helpers/exceptions.js";
import {
  PaymentStatusResult,
  SIMULATE_TRANSFER_OUTCOMES,
  SimulateTransferOutcome,
  SimulateTransferResult,
  paymentStatusResultFromMap,
  unwrapPaymentBody,
} from "../models/payment-model.js";

/**
 * Gimtel payment status polling and sandbox transfer simulation.
 */
export class PaymentStatusService {
  constructor(
    public readonly publishableApiKey: string,
    private readonly options: ClientOptions = {},
  ) {}

  private get endpoints() {
    return createEndpoints(this.options.baseUrl);
  }

  /** `GET /payment/{id}/status`. Each call is also a heartbeat that keeps a Gimtel payment claimable. */
  async getStatus(paymentId: string): Promise<PaymentStatusResult> {
    const result = await new Fetcher(this.publishableApiKey, this.options).get(
      this.endpoints.paymentStatus(paymentId),
    );
    return paymentStatusResultFromMap(unwrapPaymentBody(result.data));
  }

  /** `POST /payment/{id}/simulate-transfer` (sandbox only). */
  async simulateTransfer(paymentId: string): Promise<SimulateTransferResult> {
    const result = await new Fetcher(this.publishableApiKey, this.options).post(
      this.endpoints.simulateTransfer(paymentId),
    );
    const body = unwrapPaymentBody(result.data);
    const outcome = body.outcome;
    if (
      typeof outcome !== "string" ||
      !(SIMULATE_TRANSFER_OUTCOMES as readonly string[]).includes(outcome)
    ) {
      throw new AppException({
        code: AppExceptionCode.unknown,
        message: `Unexpected simulate-transfer outcome: ${String(outcome)}`,
        status: result.status,
      });
    }
    return { outcome: outcome as SimulateTransferOutcome };
  }
}
