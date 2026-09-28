// Type-checked by test/exports.test.mjs with no custom conditions: `moosyl-sdk`
// must resolve to the full (Node) entry.
import { Moosyl, WebhookSignatureError } from "moosyl-sdk";

export const helper = new Moosyl("k").constructWebhookEvent;
export { WebhookSignatureError };
