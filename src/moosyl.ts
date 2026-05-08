import { GetPaymentMethodsService } from "./services/get-payment-methods-service.js";
import { GetPaymentRequestService } from "./services/get-payment-request-service.js";
import { GetPaymentService } from "./services/get-payment.js";
import { PayService } from "./services/pay-service.js";
import { CreateCheckoutSessionService } from "./services/create-checkout-session-service.js";
import { ProductService } from "./services/product-service.js";
import { CustomerService } from "./services/customer-service.js";
import { SubscriptionService } from "./services/subscription-service.js";
import { InvoiceService } from "./services/invoice-service.js";
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
import type {
  ProductModel,
  ProductWithPricesModel,
} from "./models/product-model.js";
import type { CustomerModel } from "./models/customer-model.js";
import type {
  CreateSubscriptionByExternalUserRequest,
  CreateSubscriptionRequest,
  SubscriptionModel,
  SubscriptionStatus,
} from "./models/subscription-model.js";
import type { InvoiceModel } from "./models/invoice-model.js";
import type { PaginatedResponse } from "./models/pagination-model.js";

/**
 * Main Moosyl SDK client. Create an instance with your publishable API key,
 * then use the methods to fetch payment methods, payment requests, payments, and process payments.
 */
export class Moosyl {
  private readonly getPaymentMethodsService: GetPaymentMethodsService;
  private readonly getPaymentRequestService: GetPaymentRequestService;
  private readonly getPaymentService: GetPaymentService;
  private readonly payService: PayService;
  private readonly createCheckoutSessionService: CreateCheckoutSessionService;
  private readonly productService: ProductService;
  private readonly customerService: CustomerService;
  private readonly subscriptionService: SubscriptionService;
  private readonly invoiceService: InvoiceService;

  /**
   * @param apiKey - Your Moosyl publishable API key
   */
  constructor(apiKey: string) {
    this.getPaymentMethodsService = new GetPaymentMethodsService(apiKey);
    this.getPaymentRequestService = new GetPaymentRequestService(apiKey);
    this.getPaymentService = new GetPaymentService(apiKey);
    this.payService = new PayService(apiKey);
    this.createCheckoutSessionService = new CreateCheckoutSessionService(apiKey);
    this.productService = new ProductService(apiKey);
    this.customerService = new CustomerService(apiKey);
    this.subscriptionService = new SubscriptionService(apiKey);
    this.invoiceService = new InvoiceService(apiKey);
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
   * Uses the API key passed to the constructor.
   * This endpoint requires a secret API key and must be called from your backend.
   * @param request - Checkout session payload
   * @returns Checkout session and checkout URL
   */
  createCheckoutSession(
    request: CreateCheckoutSessionRequest,
  ): Promise<CreateCheckoutSessionResponse> {
    return this.createCheckoutSessionService.create(request);
  }

  // -------- Products (require secret API key) --------

  listProducts(params?: {
    id?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ProductWithPricesModel>> {
    return this.productService.list(params);
  }

  getProduct(id: string): Promise<ProductWithPricesModel> {
    return this.productService.get(id);
  }

  createProduct(data: {
    name: string;
    description?: string;
  }): Promise<ProductModel> {
    return this.productService.create(data);
  }

  updateProduct(
    id: string,
    data: { name?: string; description?: string; active?: boolean },
  ): Promise<ProductModel> {
    return this.productService.update(id, data);
  }

  archiveProduct(id: string): Promise<{ success: boolean }> {
    return this.productService.archive(id);
  }

  // -------- Customers --------

  listCustomers(params?: {
    id?: string;
    externalUserId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CustomerModel>> {
    return this.customerService.list(params);
  }

  createCustomer(data: {
    externalUserId: string;
    phone?: string;
  }): Promise<CustomerModel> {
    return this.customerService.create(data);
  }

  updateCustomer(
    id: string,
    data: { externalUserId?: string; phone?: string },
  ): Promise<CustomerModel> {
    return this.customerService.update(id, data);
  }

  // -------- Subscriptions --------

  listSubscriptions(params?: {
    status?: SubscriptionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SubscriptionModel>> {
    return this.subscriptionService.list(params);
  }

  getSubscription(id: string): Promise<SubscriptionModel> {
    return this.subscriptionService.get(id);
  }

  createSubscription(
    data: CreateSubscriptionRequest,
  ): Promise<SubscriptionModel> {
    return this.subscriptionService.create(data);
  }

  createSubscriptionByExternalUser(
    data: CreateSubscriptionByExternalUserRequest,
  ): Promise<SubscriptionModel> {
    return this.subscriptionService.createByExternalUser(data);
  }

  getSubscriptionByExternalUser(
    externalUserId: string,
  ): Promise<SubscriptionModel> {
    return this.subscriptionService.getByExternalUser(externalUserId);
  }

  cancelSubscription(id: string): Promise<SubscriptionModel> {
    return this.subscriptionService.cancel(id);
  }

  // -------- Invoices --------

  listInvoices(params?: {
    id?: string;
    externalUserId?: string;
    subscriptionId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InvoiceModel>> {
    return this.invoiceService.list(params);
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
