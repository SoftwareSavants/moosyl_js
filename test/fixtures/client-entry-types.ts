// Type-checked by test/exports.test.mjs under the react-native / browser
// conditions: `moosyl-sdk` must resolve to the client entry's types.
import { Moosyl, type PaymentStatusResult } from "moosyl-sdk";
// @ts-expect-error the client entry does not export WebhookSignatureError
import { WebhookSignatureError } from "moosyl-sdk";

export const status: Promise<PaymentStatusResult> = new Moosyl("k").getPaymentStatus("p");
// @ts-expect-error the client entry has no webhook helpers
export const helper = new Moosyl("k").constructWebhookEvent;
export { WebhookSignatureError };
