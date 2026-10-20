import { GetPaymentMethodsService } from "./services/get-payment-methods-service.js";
import { GetPaymentRequestService } from "./services/get-payment-request-service.js";
import { GetPaymentService } from "./services/get-payment.js";
import { PayService } from "./services/pay-service.js";
import { PaymentStatusService } from "./services/payment-status-service.js";
import { CreateCheckoutSessionService } from "./services/create-checkout-session-service.js";
import { ProductService } from "./services/product-service.js";
import { CustomerService } from "./services/customer-service.js";
import { SubscriptionService } from "./services/subscription-service.js";
import { InvoiceService } from "./services/invoice-service.js";
import type { PaymentMethod } from "./models/payment-method-model.js";
import type { PaymentRequestModel } from "./models/payment-request-model.js";
import type { ClientOptions, FetcherResponse } from "./helpers/fetcher.js";
import type {
  PayParams,
  PayResult,
  PaymentStatusResult,
  SimulateTransferResult,
} from "./models/payment-model.js";
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from "./models/checkout-session-model.js";
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

/** Options for `new Moosyl(apiKey, options)`. */
export type MoosylOptions = ClientOptions;

/**
 * Moosyl API client without the Node-only webhook helpers. Safe to use in
 * React Native and browsers (it only needs global `fetch`, `AbortController`
 * and `setTimeout`). The `Moosyl` class exported from the package root extends
 * this with `verifyWebhookSignature` / `constructWebhookEvent`.
 */
export class MoosylClient {
  private readonly getPaymentMethodsService: GetPaymentMethodsService;
  private readonly getPaymentRequestService: GetPaymentRequestService;
  private readonly getPaymentService: GetPaymentService;
  private readonly payService: PayService;
  private readonly paymentStatusService: PaymentStatusService;
  private readonly createCheckoutSessionService: CreateCheckoutSessionService;
  private readonly productService: ProductService;
  private readonly customerService: CustomerService;
  private readonly subscriptionService: SubscriptionService;
  private readonly invoiceService: InvoiceService;

  /**
   * @param apiKey - Your Moosyl publishable API key (secret key for backend-only methods)
   * @param options - Optional `baseUrl` (default `https://api.moosyl.com`) and
   *   `timeoutMs` (default 60 000)
   */
  constructor(apiKey: string, options: MoosylOptions = {}) {
    this.getPaymentMethodsService = new GetPaymentMethodsService(apiKey, options);
    this.getPaymentRequestService = new GetPaymentRequestService(apiKey, options);
    this.getPaymentService = new GetPaymentService(apiKey, options);
    this.payService = new PayService(apiKey, options);
    this.paymentStatusService = new PaymentStatusService(apiKey, options);
    this.createCheckoutSessionService = new CreateCheckoutSessionService(
      apiKey,
      options,
    );
    this.productService = new ProductService(apiKey, options);
    this.customerService = new CustomerService(apiKey, options);
    this.subscriptionService = new SubscriptionService(apiKey, options);
    this.invoiceService = new InvoiceService(apiKey, options);
  }

  /**
   * Fetches available payment methods (e.g. Bankily, Sedad, Masrivi).
   * Methods of a type unknown to this SDK version are skipped.
   * @param isTestingMode - Pass `true` for test configuration; omit to let the
   *   API key's environment decide
   * @returns List of payment methods (with `integration` and `isTestingMode`)
   */
  getPaymentMethods(isTestingMode?: boolean): Promise<PaymentMethod[]> {
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
   * Creates a payment and returns it typed. For Gimtel methods omit
   * `passCode` and show the returned `instructions` to the payer, then poll
   * `getPaymentStatus()`.
   */
  pay(params: PayParams): Promise<PayResult>;
  /**
   * Processes a payment (legacy positional form; returns the raw response).
   * @param transactionId - Transaction ID
   * @param phoneNumber - Customer phone number
   * @param passCode - Customer passcode (`undefined` for Gimtel methods: not sent)
   * @param paymentMethodId - Configuration ID from getPaymentMethods()
   * @returns API response
   */
  pay(
    transactionId: string,
    phoneNumber: string,
    passCode: string | undefined,
    paymentMethodId: string,
  ): Promise<FetcherResponse>;
  pay(
    paramsOrTransactionId: PayParams | string,
    phoneNumber?: string,
    passCode?: string,
    paymentMethodId?: string,
  ): Promise<PayResult | FetcherResponse> {
    if (typeof paramsOrTransactionId === "object") {
      return this.payService.payTyped(paramsOrTransactionId);
    }
    return this.payService.pay(
      paramsOrTransactionId,
      phoneNumber as string,
      passCode,
      paymentMethodId as string,
    );
  }

  /**
   * Gets a payment's status (`GET /payment/{id}/status`). For Gimtel payments,
   * call this every ~4 s while the payer is in their bank app: each call is a
   * heartbeat, and the payment stops being claimable ~10 minutes after the
   * last one. Unknown statuses are reported as `"pending"` (see `rawStatus`).
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    return this.paymentStatusService.getStatus(paymentId);
  }

  /**
   * Sandbox only: simulates the payer's bank transfer for a pending Gimtel
   * payment (`POST /payment/{id}/simulate-transfer`).
   */
  simulateTransfer(paymentId: string): Promise<SimulateTransferResult> {
    return this.paymentStatusService.simulateTransfer(paymentId);
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
}
