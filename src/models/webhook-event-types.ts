export interface PaymentRequestNested {
  id: string;
  transactionId: string;
  amount: number;
  totalAmount?: number;
  phoneNumber: string;
  status: string;
  environmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookData {
  id: string;
  amount: number;
  phoneNumber: string;
  passCode: string | null;
  status: string;
  environmentId: string;
  paymentRequestId: string;
  configurationId: string;
  referenceId: string | null;
  metadata: Record<string, unknown> | null;
  payoutId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  request: PaymentRequestNested;
  transactionId: string;
}

export interface PaymentRequestWebhookData {
  id: string;
  transactionId: string;
  amount: number;
  totalAmount?: number;
  phoneNumber: string;
  status: string;
  environmentId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface SubscriptionWebhookData {
  id: string;
  organizationId: string;
  customerId: string;
  priceId: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "paused"
    | "cancelled"
    | "expired"
    | "pending_cancellation";
  nextBillingDate: string | null;
  startedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  [key: string]: unknown;
}

export type WebhookEventName =
  | "payment-request-created"
  | "payment-request-updated"
  | "payment-created"
  | "payment-updated"
  | "subscription-created"
  | "subscription-updated";

export type WebhookEventMap =
  | { event: "payment-created"; data: PaymentWebhookData }
  | { event: "payment-updated"; data: PaymentWebhookData }
  | { event: "payment-request-created"; data: PaymentRequestWebhookData }
  | { event: "payment-request-updated"; data: PaymentRequestWebhookData }
  | { event: "subscription-created"; data: SubscriptionWebhookData }
  | { event: "subscription-updated"; data: SubscriptionWebhookData };
