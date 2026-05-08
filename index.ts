/**
 * Moosyl JS – integrating payment solutions with Mauritania's popular banking apps.
 */

export { Moosyl } from "./src/moosyl.js";
export type { CreateCheckoutSessionRequest } from "./src/models/checkout-session-model.js";
export {
  CheckoutSessionModel,
  CreateCheckoutSessionResponse,
} from "./src/models/checkout-session-model.js";
export { WebhookSignatureError } from "./src/helpers/webhook.js";
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
