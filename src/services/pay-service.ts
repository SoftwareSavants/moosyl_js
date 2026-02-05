import { Fetcher, Endpoints, FetcherResponse } from '../helpers/fetcher.js';

export type ManualPayImageInput =
  | File
  | { name: string; data: Buffer | Uint8Array | ArrayBuffer; type?: string };

/**
 * Service for processing payments (auto and manual) via the Moosyl API.
 */
export class PayService {
  constructor(public readonly publishableApiKey: string) {}

  async pay(
    transactionId: string,
    phoneNumber: string,
    passCode: string,
    paymentMethodId: string
  ): Promise<FetcherResponse> {
    const response = await new Fetcher(this.publishableApiKey).post(Endpoints.pay, {
      transactionId,
      phoneNumber,
      passCode,
      configurationId: paymentMethodId,
    });
    return response;
  }

  async manualPay(
    transactionId: string,
    paymentMethodId: string,
    selectedImage: ManualPayImageInput
  ): Promise<FetcherResponse> {
    const attachment = await toAttachment(selectedImage);
    const response = await new Fetcher(this.publishableApiKey).post(Endpoints.manualPayment, {
      transactionId,
      configurationId: paymentMethodId,
      attachments: [attachment],
    });
    return response;
  }
}

interface AttachmentShape {
  name: string;
  type: string;
  size: number;
  data: string;
}

async function toAttachment(input: ManualPayImageInput): Promise<AttachmentShape> {
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

function bufferToBase64(buf: ArrayBuffer | Buffer | Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return (Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer)).toString('base64');
  }
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
