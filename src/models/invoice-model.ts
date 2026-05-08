export type InvoiceStatus = "pending" | "paid" | "void" | "refunded";

/**
 * An invoice generated for a customer (e.g. from a subscription cycle).
 */
export class InvoiceModel {
  readonly id: string;
  readonly customerId: string;
  readonly organizationId: string;
  readonly status: InvoiceStatus;
  readonly amount: string;
  readonly dueDate: string | null;
  readonly paymentRequestId: string | null;
  readonly createdAt: string | null;

  constructor(options: {
    id: string;
    customerId: string;
    organizationId: string;
    status: InvoiceStatus;
    amount: string;
    dueDate?: string | null;
    paymentRequestId?: string | null;
    createdAt?: string | null;
  }) {
    this.id = options.id;
    this.customerId = options.customerId;
    this.organizationId = options.organizationId;
    this.status = options.status;
    this.amount = options.amount;
    this.dueDate = options.dueDate ?? null;
    this.paymentRequestId = options.paymentRequestId ?? null;
    this.createdAt = options.createdAt ?? null;
  }

  static fromMap(map: Record<string, unknown>): InvoiceModel {
    return new InvoiceModel({
      id: String(map.id ?? ""),
      customerId: String(map.customerId ?? ""),
      organizationId: String(map.organizationId ?? ""),
      status: String(map.status ?? "pending") as InvoiceStatus,
      amount: String(map.amount ?? "0"),
      dueDate: map.dueDate == null ? null : String(map.dueDate),
      paymentRequestId:
        map.paymentRequestId == null ? null : String(map.paymentRequestId),
      createdAt: map.createdAt == null ? null : String(map.createdAt),
    });
  }
}
