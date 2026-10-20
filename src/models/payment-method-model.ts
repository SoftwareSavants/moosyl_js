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

/** True when `method` is a payment method type this SDK version knows. */
export function isPaymentMethodType(
  method: unknown,
): method is PaymentMethodTypesValue {
  return (
    typeof method === "string" &&
    Object.values(METHOD_TO_STR).includes(method as PaymentMethodTypesValue)
  );
}

/**
 * How a payment method is processed: `native` (direct bank API, e.g. Bankily
 * with a passcode) or `gimtel` (the payer transfers from their bank app and
 * Moosyl detects the transfer).
 */
export type PaymentMethodIntegration = "native" | "gimtel";

/** Parses the backend `integration` value; anything but `"gimtel"` is `"native"`. */
export function paymentMethodIntegrationFromString(
  value: unknown,
): PaymentMethodIntegration {
  return value === "gimtel" ? "gimtel" : "native";
}

export function paymentMethodTypesFromString(
  method: string,
): PaymentMethodTypesValue {
  const entry = Object.entries(METHOD_TO_STR).find(([, v]) => v === method);
  if (entry) return entry[1];
  throw new Error("This payment method is not supported");
}

/**
 * Payment method (configuration) returned by `getPaymentMethods()`.
 */
export class PaymentMethod {
  readonly id: string;
  readonly method: PaymentMethodTypesValue;
  readonly bPayNumber: string;
  /** `"native"` or `"gimtel"`. Defaults to `"native"` when the backend omits it. */
  readonly integration: PaymentMethodIntegration;
  /** Whether this configuration belongs to a testing (sandbox) environment. */
  readonly isTestingMode: boolean;

  constructor(options: {
    id: string;
    method: PaymentMethodTypesValue;
    bPayNumber?: string;
    integration?: PaymentMethodIntegration;
    isTestingMode?: boolean;
  }) {
    this.id = options.id;
    this.method = options.method;
    this.bPayNumber = options.bPayNumber ?? "";
    this.integration = options.integration ?? "native";
    this.isTestingMode = options.isTestingMode ?? false;
  }

  /** True for Gimtel methods: call `pay()` without a passcode and show the returned instructions. */
  get isGimtel(): boolean {
    return this.integration === "gimtel";
  }

  /** Throws for unknown `type` values; `getPaymentMethods()` skips those instead. */
  static fromMap(map: Record<string, unknown>): PaymentMethod {
    const config =
      map.config && typeof map.config === "object"
        ? (map.config as Record<string, unknown>)
        : {};
    return new PaymentMethod({
      id: String(map.id),
      method: paymentMethodTypesFromString(String(map.type)),
      bPayNumber: String(config.code ?? ""),
      integration: paymentMethodIntegrationFromString(map.integration),
      isTestingMode: map.isTestingMode === true,
    });
  }
}
