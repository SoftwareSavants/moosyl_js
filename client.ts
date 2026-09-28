/**
 * `moosyl-sdk/client` – the Moosyl API client without the Node-only webhook
 * helpers. Safe for React Native and browsers: nothing reachable from this
 * entry imports `node:*` modules or uses `Buffer`/`process`.
 *
 * `Moosyl` here is `MoosylClient` (every API method, no
 * `verifyWebhookSignature` / `constructWebhookEvent`).
 */

export { MoosylClient, MoosylClient as Moosyl } from "./src/client.js";
export type { MoosylOptions } from "./src/client.js";
export type { ClientOptions } from "./src/helpers/fetcher.js";
export {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  FetcherResponse,
} from "./src/helpers/fetcher.js";
export { AppException, AppExceptionCode } from "./src/helpers/exceptions.js";
export type {
  AppExceptionCodeType,
  AppExceptionOptions,
} from "./src/helpers/exceptions.js";

// Payment methods
export {
  PaymentMethod,
  PaymentMethodTypes,
  PaymentMethodTitles,
  isPaymentMethodType,
} from "./src/models/payment-method-model.js";
export type {
  PaymentMethodTypesValue,
  PaymentMethodIntegration,
} from "./src/models/payment-method-model.js";
export { PaymentRequestModel } from "./src/models/payment-request-model.js";

// Payments / Gimtel
export {
  GIMTEL_PAYMENT_STATUSES,
  SIMULATE_TRANSFER_OUTCOMES,
  gimtelPaymentStatusFromString,
} from "./src/models/payment-model.js";
export type {
  GimtelPaymentStatus,
  GimtelInstructions,
  PayParams,
  PayResult,
  PaymentStatusResult,
  SimulateTransferOutcome,
  SimulateTransferResult,
} from "./src/models/payment-model.js";

// Checkout sessions
export type { CreateCheckoutSessionRequest } from "./src/models/checkout-session-model.js";
export {
  CheckoutSessionModel,
  CreateCheckoutSessionResponse,
} from "./src/models/checkout-session-model.js";

// Webhook payload types (types only; verification lives in the root entry)
export type {
  WebhookEventMap,
  WebhookEventName,
  PaymentWebhookData,
  PaymentRequestWebhookData,
  PaymentRequestNested,
  SubscriptionWebhookData,
} from "./src/models/webhook-event-types.js";

// Subscription billing models
export {
  ProductModel,
  ProductWithPricesModel,
  PriceModel,
} from "./src/models/product-model.js";
export type { PriceInterval } from "./src/models/product-model.js";

export { CustomerModel } from "./src/models/customer-model.js";

export { SubscriptionModel } from "./src/models/subscription-model.js";
export type {
  SubscriptionStatus,
  TrialPeriod,
  CreateSubscriptionRequest,
  CreateSubscriptionByExternalUserRequest,
} from "./src/models/subscription-model.js";

export { InvoiceModel } from "./src/models/invoice-model.js";
export type { InvoiceStatus } from "./src/models/invoice-model.js";

export { PaginationModel } from "./src/models/pagination-model.js";
export type { PaginatedResponse } from "./src/models/pagination-model.js";
