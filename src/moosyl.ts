import { MoosylClient } from "./client.js";
import {
  verifyWebhookSignature as verifyWebhookSignatureImpl,
  constructWebhookEvent as constructWebhookEventImpl,
} from "./helpers/webhook.js";
import type { WebhookEventMap } from "./models/webhook-event-types.js";

/**
 * Main Moosyl SDK client. Create an instance with your publishable API key,
 * then use the methods to fetch payment methods, payment requests, payments, and process payments.
 *
 * This class adds the webhook helpers (which need `node:crypto`) on top of
 * `MoosylClient`. In React Native or browsers, import from `moosyl-sdk/client`
 * instead (React Native's Metro resolves `moosyl-sdk` there automatically).
 */
export class Moosyl extends MoosylClient {
  /**
   * Verifies the webhook signature (HMAC-SHA256). Use the raw request body and
   * the `x-webhook-signature` header. Requires your webhook secret (server-side only).
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string | undefined | null,
    secret: string,
  ): boolean {
    return verifyWebhookSignatureImpl(payload, signature, secret);
  }

  /**
   * Verifies the webhook signature and parses the payload into a type-safe { event, data }.
   * Throws WebhookSignatureError if the signature is invalid or the event is unknown.
   * Use the raw request body; do not use a body that has been parsed as JSON.
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string | undefined | null,
    secret: string,
  ): WebhookEventMap {
    return constructWebhookEventImpl(payload, signature, secret);
  }
}
