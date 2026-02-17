import { GetPaymentMethodsService } from "./services/get-payment-methods-service.js";
import { GetPaymentRequestService } from "./services/get-payment-request-service.js";
import { GetPaymentService } from "./services/get-payment.js";
import { PayService } from "./services/pay-service.js";
import { CreateCheckoutSessionService } from "./services/create-checkout-session-service.js";
import {
  verifyWebhookSignature as verifyWebhookSignatureImpl,
  constructWebhookEvent as constructWebhookEventImpl,
} from "./helpers/webhook.js";
import type { PaymentMethod } from "./models/payment-method-model.js";
import type { PaymentRequestModel } from "./models/payment-request-model.js";
import type { FetcherResponse } from "./helpers/fetcher.js";
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from "./models/checkout-session-model.js";
import type { WebhookEventMap } from "./models/webhook-event-types.js";

/**
 * Main Moosyl SDK client. Create an instance with your publishable API key,
 * then use the methods to fetch payment methods, payment requests, payments, and process payments.
 */
export class Moosyl {
  private readonly getPaymentMethodsService: GetPaymentMethodsService;
  private readonly getPaymentRequestService: GetPaymentRequestService;
  private readonly getPaymentService: GetPaymentService;
  private readonly payService: PayService;

  /**
   * @param apiKey - Your Moosyl publishable API key
   */
  constructor(apiKey: string) {
    this.getPaymentMethodsService = new GetPaymentMethodsService(apiKey);
    this.getPaymentRequestService = new GetPaymentRequestService(apiKey);
    this.getPaymentService = new GetPaymentService(apiKey);
    this.payService = new PayService(apiKey);
  }

  /**
   * Fetches available payment methods (e.g. Bankily, Sedad, Masrivi).
   * @param isTestingMode - Pass `true` for test configuration
   * @returns List of payment methods
   */
  getPaymentMethods(isTestingMode: boolean): Promise<PaymentMethod[]> {
    return this.getPaymentMethodsService.get(isTestingMode);
  }

  /**
   * Fetches payment request details for a transaction.
   * @param transactionId - The transaction ID from your backend
   * @returns Payment request (id, amount, phoneNumber)
   */
  getPaymentRequest(transactionId: string): Promise<PaymentRequestModel> {
    return this.getPaymentRequestService.get(transactionId);
  }

  /**
   * Fetches a single payment by ID. Returns the raw API response (response.data holds the payment object).
   * @param paymentId - The payment ID
   * @returns FetcherResponse (use .data for the payload)
   */
  getPayment(paymentId: string): Promise<FetcherResponse> {
    return this.getPaymentService.get(paymentId);
  }

  /**
   * Processes a payment (e.g. Bankily).
   * @param transactionId - Transaction ID
   * @param phoneNumber - Customer phone number
   * @param passCode - Customer passcode
   * @param paymentMethodId - Configuration ID from getPaymentMethods()
   * @returns API response
   */
  pay(
    transactionId: string,
    phoneNumber: string,
    passCode: string,
    paymentMethodId: string,
  ): Promise<FetcherResponse> {
    return this.payService.pay(
      transactionId,
      phoneNumber,
      passCode,
      paymentMethodId,
    );
  }

  /**
   * Creates a checkout session.
   * This endpoint requires your Moosyl secret API key and must be called from your backend.
   * @param secretApiKey - Your Moosyl secret API key
   * @param request - Checkout session payload
   * @returns Checkout session and checkout URL
   */
  createCheckoutSession(
    secretApiKey: string,
    request: CreateCheckoutSessionRequest,
  ): Promise<CreateCheckoutSessionResponse> {
    return new CreateCheckoutSessionService(secretApiKey).create(request);
  }

  /**
   * Verifies the webhook signature (HMAC-SHA256). Use the raw request body and
   * the `x-webhook-signature` header. Requires your webhook secret (server-side only).
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string | undefined | null,
    secret: string,
  ): boolean {
    return verifyWebhookSignatureImpl(payload, signature, secret);
  }

  /**
   * Verifies the webhook signature and parses the payload into a type-safe { event, data }.
   * Throws WebhookSignatureError if the signature is invalid or the event is unknown.
   * Use the raw request body; do not use a body that has been parsed as JSON.
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string | undefined | null,
    secret: string,
  ): WebhookEventMap {
    return constructWebhookEventImpl(payload, signature, secret);
  }
}
