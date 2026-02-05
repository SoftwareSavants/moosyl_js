export type PaymentTypeValue = 'manual' | 'auto';

export const PaymentType = {
  manual: 'manual',
  auto: 'auto',
} as const;

export function paymentTypeFromString(type: string): PaymentTypeValue {
  if (type === PaymentType.manual || type === PaymentType.auto) return type;
  throw new Error('This payment method is not supported');
}

export type PaymentMethodTypesValue =
  | 'masrivi'
  | 'bankily'
  | 'sedad'
  | 'bim_bank'
  | 'amanty'
  | 'bci_pay';

export const PaymentMethodTypes = {
  masrivi: 'masrivi',
  bankily: 'bankily',
  sedad: 'sedad',
  bimBank: 'bim_bank',
  amanty: 'amanty',
  bCIpay: 'bci_pay',
} as const;

const METHOD_TO_STR: Record<string, PaymentMethodTypesValue> = {
  [PaymentMethodTypes.masrivi]: 'masrivi',
  [PaymentMethodTypes.bankily]: 'bankily',
  [PaymentMethodTypes.sedad]: 'sedad',
  [PaymentMethodTypes.bimBank]: 'bim_bank',
  [PaymentMethodTypes.amanty]: 'amanty',
  [PaymentMethodTypes.bCIpay]: 'bci_pay',
};

/** Human-readable titles for payment methods (no i18n in core). */
export const PaymentMethodTitles: Record<string, string> = {
  masrivi: 'Masrivi',
  bankily: 'Bankily',
  sedad: 'Sedad',
  bim_bank: 'Bim Bank',
  amanty: 'Amanty',
  bci_pay: 'BCIpay',
};

export function paymentMethodTypesFromString(method: string): PaymentMethodTypesValue {
  const entry = Object.entries(METHOD_TO_STR).find(([, v]) => v === method);
  if (entry) return entry[1];
  throw new Error('This payment method is not supported');
}

/**
 * Base payment method (id, method type, payment type).
 */
export class PaymentMethod {
  readonly id: string;
  readonly method: PaymentMethodTypesValue;
  readonly type: PaymentTypeValue;

  constructor(options: { id: string; method: PaymentMethodTypesValue; type: PaymentTypeValue }) {
    this.id = options.id;
    this.method = options.method;
    this.type = options.type;
  }

  static fromMap(map: Record<string, unknown>): PaymentMethod {
    return new PaymentMethod({
      id: String(map.id),
      method: paymentMethodTypesFromString(String(map.type)),
      type: paymentTypeFromString(String(map.configurationType)),
    });
  }

  static fromPaymentMethod(map: Record<string, unknown>): PaymentMethod {
    paymentMethodTypesFromString(String(map.type));
    return BankilyConfigModel.fromMap(map);
  }

  static fromPaymentType(map: Record<string, unknown>): PaymentMethod {
    const configType = paymentTypeFromString(String(map.configurationType));
    if (configType === PaymentType.auto) {
      return PaymentMethod.fromPaymentMethod(map);
    }
    return ManualConfigModel.fromMap(map);
  }
}

/**
 * Bankily payment method config (adds bPayNumber).
 */
export class BankilyConfigModel extends PaymentMethod {
  readonly bPayNumber: string;

  constructor(options: {
    id: string;
    method: PaymentMethodTypesValue;
    type: PaymentTypeValue;
    bPayNumber: string;
  }) {
    super(options);
    this.bPayNumber = options.bPayNumber;
  }

  static override fromMap(map: Record<string, unknown>): BankilyConfigModel {
    const base = PaymentMethod.fromMap(map);
    const config = map.config && typeof map.config === 'object' ? (map.config as Record<string, unknown>) : {};
    return new BankilyConfigModel({
      id: base.id,
      method: base.method,
      type: base.type,
      bPayNumber: String(config.code ?? ''),
    });
  }
}

/**
 * Manual payment method config (adds merchantCode).
 */
export class ManualConfigModel extends PaymentMethod {
  readonly merchantCode: string;

  constructor(options: {
    id: string;
    method: PaymentMethodTypesValue;
    type: PaymentTypeValue;
    merchantCode: string;
  }) {
    super(options);
    this.merchantCode = options.merchantCode;
  }

  static override fromMap(map: Record<string, unknown>): ManualConfigModel {
    const base = PaymentMethod.fromMap(map);
    const config = map.config && typeof map.config === 'object' ? (map.config as Record<string, unknown>) : {};
    return new ManualConfigModel({
      id: base.id,
      method: base.method,
      type: base.type,
      merchantCode: String(config.code ?? ''),
    });
  }
}
