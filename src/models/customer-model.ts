/**
 * A customer record (linked to an external user in the host application).
 */
export class CustomerModel {
  readonly id: string;
  readonly organizationId: string;
  readonly externalUserId: string;
  readonly phone: string | null;
  readonly createdAt: string | null;

  constructor(options: {
    id: string;
    organizationId: string;
    externalUserId: string;
    phone?: string | null;
    createdAt?: string | null;
  }) {
    this.id = options.id;
    this.organizationId = options.organizationId;
    this.externalUserId = options.externalUserId;
    this.phone = options.phone ?? null;
    this.createdAt = options.createdAt ?? null;
  }

  static fromMap(map: Record<string, unknown>): CustomerModel {
    return new CustomerModel({
      id: String(map.id ?? ""),
      organizationId: String(map.organizationId ?? ""),
      externalUserId: String(map.externalUserId ?? ""),
      phone: map.phone == null ? null : String(map.phone),
      createdAt: map.createdAt == null ? null : String(map.createdAt),
    });
  }
}
