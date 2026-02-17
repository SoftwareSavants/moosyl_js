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

export type WebhookEventName =
  | "payment-request-created"
  | "payment-request-updated"
  | "payment-created"
  | "payment-updated";

export type WebhookEventMap =
  | { event: "payment-created"; data: PaymentWebhookData }
  | { event: "payment-updated"; data: PaymentWebhookData }
  | { event: "payment-request-created"; data: PaymentRequestWebhookData }
  | { event: "payment-request-updated"; data: PaymentRequestWebhookData };
