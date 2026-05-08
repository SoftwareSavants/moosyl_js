export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending_cancellation";

export type TrialPeriod = "1_week" | "1_month" | "1_year";

export interface CreateSubscriptionRequest {
  customerId: string;
  priceId: string;
  trial?: boolean | "trialing";
  trialPeriod?: TrialPeriod;
  trialEnd?: string;
  startedAt?: string;
  expiresAt?: string;
}

export interface CreateSubscriptionByExternalUserRequest {
  externalUserId: string;
  phone?: string;
  priceId: string;
  trial?: boolean | "trialing";
  trialPeriod?: TrialPeriod;
  trialEnd?: string;
  startedAt?: string;
  expiresAt?: string;
}

/**
 * A subscription linking a customer to a price.
 */
export class SubscriptionModel {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly priceId: string;
  readonly status: SubscriptionStatus;
  readonly nextBillingDate: string | null;
  readonly startedAt: string | null;
  readonly cancelledAt: string | null;
  readonly expiresAt: string | null;

  constructor(options: {
    id: string;
    organizationId: string;
    customerId: string;
    priceId: string;
    status: SubscriptionStatus;
    nextBillingDate?: string | null;
    startedAt?: string | null;
    cancelledAt?: string | null;
    expiresAt?: string | null;
  }) {
    this.id = options.id;
    this.organizationId = options.organizationId;
    this.customerId = options.customerId;
    this.priceId = options.priceId;
    this.status = options.status;
    this.nextBillingDate = options.nextBillingDate ?? null;
    this.startedAt = options.startedAt ?? null;
    this.cancelledAt = options.cancelledAt ?? null;
    this.expiresAt = options.expiresAt ?? null;
  }

  static fromMap(map: Record<string, unknown>): SubscriptionModel {
    return new SubscriptionModel({
      id: String(map.id ?? ""),
      organizationId: String(map.organizationId ?? ""),
      customerId: String(map.customerId ?? ""),
      priceId: String(map.priceId ?? ""),
      status: String(map.status ?? "active") as SubscriptionStatus,
      nextBillingDate:
        map.nextBillingDate == null ? null : String(map.nextBillingDate),
      startedAt: map.startedAt == null ? null : String(map.startedAt),
      cancelledAt:
        map.cancelledAt == null ? null : String(map.cancelledAt),
      expiresAt: map.expiresAt == null ? null : String(map.expiresAt),
    });
  }
}
