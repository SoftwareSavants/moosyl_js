import { GetPaymentMethodsService } from "./services/get-payment-methods-service.js";
import { GetPaymentRequestService } from "./services/get-payment-request-service.js";
import { GetPaymentService } from "./services/get-payment.js";
import { PayService } from "./services/pay-service.js";
import { CreateCheckoutSessionService } from "./services/create-checkout-session-service.js";
import type { PaymentMethod } from "./models/payment-method-model.js";
import type { PaymentRequestModel } from "./models/payment-request-model.js";
import type { FetcherResponse } from "./helpers/fetcher.js";
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from "./models/checkout-session-model.js";

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
}
