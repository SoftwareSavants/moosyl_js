export type PaymentMethodTypesValue =
  | "masrivi"
  | "bankily"
  | "sedad"
  | "bim_bank"
  | "amanty"
  | "bci_pay";

export const PaymentMethodTypes = {
  masrivi: "masrivi",
  bankily: "bankily",
  sedad: "sedad",
  bimBank: "bim_bank",
  amanty: "amanty",
  bCIpay: "bci_pay",
} as const;

const METHOD_TO_STR: Record<string, PaymentMethodTypesValue> = {
  [PaymentMethodTypes.masrivi]: "masrivi",
  [PaymentMethodTypes.bankily]: "bankily",
  [PaymentMethodTypes.sedad]: "sedad",
  [PaymentMethodTypes.bimBank]: "bim_bank",
  [PaymentMethodTypes.amanty]: "amanty",
  [PaymentMethodTypes.bCIpay]: "bci_pay",
};

/** Human-readable titles for payment methods (no i18n in core). */
export const PaymentMethodTitles: Record<string, string> = {
  masrivi: "Masrivi",
  bankily: "Bankily",
  sedad: "Sedad",
  bim_bank: "Bim Bank",
  amanty: "Amanty",
  bci_pay: "BCIpay",
};

export function paymentMethodTypesFromString(
  method: string,
): PaymentMethodTypesValue {
  const entry = Object.entries(METHOD_TO_STR).find(([, v]) => v === method);
  if (entry) return entry[1];
  throw new Error("This payment method is not supported");
}

/**
 * Base payment method (id, method type, payment type).
 */
export class PaymentMethod {
  readonly id: string;
  readonly method: PaymentMethodTypesValue;
  readonly bPayNumber: string;

  constructor(options: {
    id: string;
    method: PaymentMethodTypesValue;
    bPayNumber?: string;
  }) {
    this.id = options.id;
    this.method = options.method;
    this.bPayNumber = options.bPayNumber ?? "";
  }

  static fromMap(map: Record<string, unknown>): PaymentMethod {
    const config =
      map.config && typeof map.config === "object"
        ? (map.config as Record<string, unknown>)
        : {};
    return new PaymentMethod({
      id: String(map.id),
      method: paymentMethodTypesFromString(String(map.type)),
      bPayNumber: String(config.code ?? ""),
    });
  }
}
