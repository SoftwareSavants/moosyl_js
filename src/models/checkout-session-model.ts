export interface CreateCheckoutSessionRequest {
  paymentRequestId: string;
  transactionId: string;
  amount: number;
  phoneNumber: string;
  successUrl: string;
  cancelUrl: string;
  expiresInMinutes: number;
}

export class CheckoutSessionModel {
  readonly id: string;
  readonly paymentRequestId: string;
  readonly environmentId: string;
  readonly selectedConfigurationId: string;
  readonly status: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly expiresAt: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;

  constructor(
    options: {
      id: string;
      paymentRequestId: string;
      environmentId: string;
      selectedConfigurationId: string;
      status: string;
      successUrl: string;
      cancelUrl: string;
      expiresAt?: string | null;
      completedAt?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    },
  ) {
    this.id = options.id;
    this.paymentRequestId = options.paymentRequestId;
    this.environmentId = options.environmentId;
    this.selectedConfigurationId = options.selectedConfigurationId;
    this.status = options.status;
    this.successUrl = options.successUrl;
    this.cancelUrl = options.cancelUrl;
    this.expiresAt = options.expiresAt ?? null;
    this.completedAt = options.completedAt ?? null;
    this.createdAt = options.createdAt ?? null;
    this.updatedAt = options.updatedAt ?? null;
  }

  static fromMap(map: Record<string, unknown>): CheckoutSessionModel {
    return new CheckoutSessionModel({
      id: String(map.id ?? ""),
      paymentRequestId: String(map.paymentRequestId ?? ""),
      environmentId: String(map.environmentId ?? ""),
      selectedConfigurationId: String(map.selectedConfigurationId ?? ""),
      status: String(map.status ?? ""),
      successUrl: String(map.successUrl ?? ""),
      cancelUrl: String(map.cancelUrl ?? ""),
      expiresAt:
        map.expiresAt == null ? null : String(map.expiresAt),
      completedAt:
        map.completedAt == null ? null : String(map.completedAt),
      createdAt:
        map.createdAt == null ? null : String(map.createdAt),
      updatedAt:
        map.updatedAt == null ? null : String(map.updatedAt),
    });
  }
}

export class CreateCheckoutSessionResponse {
  readonly data: CheckoutSessionModel;
  readonly checkoutUrl: string;

  constructor(options: { data: CheckoutSessionModel; checkoutUrl: string }) {
    this.data = options.data;
    this.checkoutUrl = options.checkoutUrl;
  }

  static fromMap(map: Record<string, unknown>): CreateCheckoutSessionResponse {
    const data = map.data;
    return new CreateCheckoutSessionResponse({
      data: CheckoutSessionModel.fromMap(
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : {},
      ),
      checkoutUrl: String(map.checkoutUrl ?? ""),
    });
  }
}
