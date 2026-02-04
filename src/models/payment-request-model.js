/**
 * Payment request details (id, phoneNumber, amount).
 */
export class PaymentRequestModel {
  /**
   * @param {object} options
   * @param {string} options.id
   * @param {string} [options.phoneNumber]
   * @param {number} options.amount
   */
  constructor({ id, phoneNumber, amount }) {
    this.id = id;
    this.phoneNumber = phoneNumber ?? null;
    this.amount = amount;
  }

  /**
   * @param {Record<string, unknown>} map
   * @returns {PaymentRequestModel}
   */
  static fromMap(map) {
    const amount = map.amount;
    return new PaymentRequestModel({
      id: String(map.id),
      phoneNumber: map.phoneNumber != null ? String(map.phoneNumber) : undefined,
      amount: typeof amount === 'number' ? amount : Number(amount),
    });
  }
}
