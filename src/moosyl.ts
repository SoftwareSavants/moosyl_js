import { GetPaymentMethodsService } from "./services/get-payment-methods-service.js";
import { GetPaymentRequestService } from "./services/get-payment-request-service.js";
import { PayService } from "./services/pay-service.js";
import type { PaymentMethod } from "./models/payment-method-model.js";
import type { PaymentRequestModel } from "./models/payment-request-model.js";
import type { FetcherResponse } from "./helpers/fetcher.js";
import type { ManualPayImageInput } from "./services/pay-service.js";

/**
 * Main Moosyl SDK client. Create an instance with your publishable API key,
 * then use the methods to fetch payment methods, payment requests, and process payments.
 */
export class Moosyl {
  private readonly getPaymentMethodsService: GetPaymentMethodsService;
  private readonly getPaymentRequestService: GetPaymentRequestService;
  private readonly payService: PayService;

  /**
   * @param apiKey - Your Moosyl publishable API key
   */
  constructor(apiKey: string) {
    this.getPaymentMethodsService = new GetPaymentMethodsService(apiKey);
    this.getPaymentRequestService = new GetPaymentRequestService(apiKey);
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
   * Processes an automatic payment (e.g. Bankily).
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
}
