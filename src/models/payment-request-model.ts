/**
 * Payment request details (id, phoneNumber, amount).
 */
export class PaymentRequestModel {
  readonly id: string;
  readonly phoneNumber: string | null;
  readonly amount: number;

  constructor(options: { id: string; phoneNumber?: string; amount: number }) {
    this.id = options.id;
    this.phoneNumber = options.phoneNumber ?? null;
    this.amount = options.amount;
  }

  static fromMap(map: Record<string, unknown>): PaymentRequestModel {
    const amount = map.amount;
    return new PaymentRequestModel({
      id: String(map.id),
      phoneNumber: map.phoneNumber != null ? String(map.phoneNumber) : undefined,
      amount: typeof amount === 'number' ? amount : Number(amount),
    });
  }
}
