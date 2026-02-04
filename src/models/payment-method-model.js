/** @typedef {'manual' | 'auto'} PaymentTypeValue */

export const PaymentType = {
  manual: 'manual',
  auto: 'auto',
};

/**
 * @param {string} type
 * @returns {PaymentTypeValue}
 */
export function paymentTypeFromString(type) {
  if (type === PaymentType.manual || type === PaymentType.auto) return type;
  throw new Error('This payment method is not supported');
}

/** @typedef {'masrivi'|'bankily'|'sedad'|'bim_bank'|'amanty'|'bci_pay'} PaymentMethodTypesValue */

export const PaymentMethodTypes = {
  masrivi: 'masrivi',
  bankily: 'bankily',
  sedad: 'sedad',
  bimBank: 'bim_bank',
  amanty: 'amanty',
  bCIpay: 'bci_pay',
};

const METHOD_TO_STR = {
  [PaymentMethodTypes.masrivi]: 'masrivi',
  [PaymentMethodTypes.bankily]: 'bankily',
  [PaymentMethodTypes.sedad]: 'sedad',
  [PaymentMethodTypes.bimBank]: 'bim_bank',
  [PaymentMethodTypes.amanty]: 'amanty',
  [PaymentMethodTypes.bCIpay]: 'bci_pay',
};

/** Human-readable titles for payment methods (no i18n in core). */
export const PaymentMethodTitles = {
  masrivi: 'Masrivi',
  bankily: 'Bankily',
  sedad: 'Sedad',
  bim_bank: 'Bim Bank',
  amanty: 'Amanty',
  bci_pay: 'BCIpay',
};

/**
 * @param {string} method
 * @returns {PaymentMethodTypesValue}
 */
export function paymentMethodTypesFromString(method) {
  const entry = Object.entries(METHOD_TO_STR).find(([, v]) => v === method);
  if (entry) return entry[1];
  throw new Error('This payment method is not supported');
}

/**
 * Base payment method (id, method type, payment type).
 */
export class PaymentMethod {
  /**
   * @param {object} options
   * @param {string} options.id
   * @param {PaymentMethodTypesValue} options.method
   * @param {PaymentTypeValue} options.type
   */
  constructor({ id, method, type }) {
    this.id = id;
    this.method = method;
    this.type = type;
  }

  /**
   * @param {Record<string, unknown>} map
   * @returns {PaymentMethod}
   */
  static fromMap(map) {
    return new PaymentMethod({
      id: String(map.id),
      method: paymentMethodTypesFromString(String(map.type)),
      type: paymentTypeFromString(String(map.configurationType)),
    });
  }

  /**
   * @param {Record<string, unknown>} map
   * @returns {PaymentMethod}
   */
  static fromPaymentMethod(map) {
    const method = paymentMethodTypesFromString(String(map.type));
    // if (method === PaymentMethodTypes.bankily) {
      return BankilyConfigModel.fromMap(map);
    // }
    // throw new Error('This payment method is not supported');
  }

  /**
   * @param {Record<string, unknown>} map
   * @returns {PaymentMethod}
   */
  static fromPaymentType(map) {
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
  /**
   * @param {object} options
   * @param {string} options.id
   * @param {PaymentMethodTypesValue} options.method
   * @param {PaymentTypeValue} options.type
   * @param {string} options.bPayNumber
   */
  constructor({ id, method, type, bPayNumber }) {
    super({ id, method, type });
    this.bPayNumber = bPayNumber;
  }

  /**
   * @param {Record<string, unknown>} map
   * @returns {BankilyConfigModel}
   */
  static fromMap(map) {
    const base = PaymentMethod.fromMap(map);
    const config = map.config && typeof map.config === 'object' ? map.config : {};
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
  /**
   * @param {object} options
   * @param {string} options.id
   * @param {PaymentMethodTypesValue} options.method
   * @param {PaymentTypeValue} options.type
   * @param {string} options.merchantCode
   */
  constructor({ id, method, type, merchantCode }) {
    super({ id, method, type });
    this.merchantCode = merchantCode;
  }

  /**
   * @param {Record<string, unknown>} map
   * @returns {ManualConfigModel}
   */
  static fromMap(map) {
    const base = PaymentMethod.fromMap(map);
    const config = map.config && typeof map.config === 'object' ? map.config : {};
    return new ManualConfigModel({
      id: base.id,
      method: base.method,
      type: base.type,
      merchantCode: String(config.code ?? ''),
    });
  }
}
