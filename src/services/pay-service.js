import { Fetcher, Endpoints } from '../helpers/fetcher.js';

/**
 * Service for processing payments (auto and manual) via the Moosyl API.
 */
export class PayService {
  /**
   * @param {string} publishableApiKey - API key for authentication with the backend
   */
  constructor(publishableApiKey) {
    this.publishableApiKey = publishableApiKey;
  }

  /**
   * Processes an automatic payment (e.g. Bankily).
   *
   * @param {string} transactionId - Unique identifier for the transaction
   * @param {string} phoneNumber - Customer phone number
   * @param {string} passCode - Customer passcode
   * @param {string} paymentMethodId - Selected payment method (configuration) ID
   * @returns {Promise<import('../helpers/fetcher.js').FetcherResponse>}
   */
  async pay(transactionId, phoneNumber, passCode, paymentMethodId) {
    const response = await new Fetcher(this.publishableApiKey).post(
      Endpoints.pay,
      {
        transactionId,
        phoneNumber,
        passCode,
        configurationId: paymentMethodId,
      }
    );
    return response;
  }

  /**
   * Processes a manual payment by sending transaction details and a screenshot.
   * Sends a JSON body with base64-encoded image in an `attachments` array.
   *
   * @param {string} transactionId - Unique identifier for the transaction
   * @param {string} paymentMethodId - Selected payment method (configuration) ID
   * @param {File | { name: string; data: Buffer | Uint8Array | ArrayBuffer; type?: string }} selectedImage - Screenshot of the payment (File in browser, or { name, data, type } in Node)
   * @returns {Promise<import('../helpers/fetcher.js').FetcherResponse>}
   */
  async manualPay(transactionId, paymentMethodId, selectedImage) {
    const attachment = await toAttachment(selectedImage);
    const response = await new Fetcher(this.publishableApiKey).post(
      Endpoints.manualPayment,
      {
        transactionId,
        configurationId: paymentMethodId,
        attachments: [attachment],
      }
    );
    return response;
  }
}

/**
 * Normalizes File or { name, data, type } into API attachment shape with base64 data.
 * @param {File | { name: string; data: Buffer | Uint8Array | ArrayBuffer; type?: string }} input
 * @returns {Promise<{ name: string; type: string; size: number; data: string }>}
 */
async function toAttachment(input) {
  if (input instanceof File) {
    const buffer = await input.arrayBuffer();
    const base64 = bufferToBase64(buffer);
    return {
      name: input.name,
      type: input.type || 'application/octet-stream',
      size: input.size,
      data: base64,
    };
  }
  const { name, data, type = 'application/octet-stream' } = input;
  const buf = data instanceof Buffer ? data : new Uint8Array(data);
  const size = buf.byteLength ?? buf.length;
  return {
    name,
    type,
    size,
    data: bufferToBase64(buf),
  };
}

/**
 * @param {ArrayBuffer | Buffer | Uint8Array} buf
 * @returns {string}
 */
function bufferToBase64(buf) {
  if (typeof Buffer !== 'undefined') {
    return (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('base64');
  }
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
