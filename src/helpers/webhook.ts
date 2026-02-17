import crypto from "node:crypto";
import type {
  WebhookEventMap,
  WebhookEventName,
} from "../models/webhook-event-types.js";

const SIGNATURE_PREFIX = "sha256=";
const WEBHOOK_EVENT_NAMES: WebhookEventName[] = [
  "payment-request-created",
  "payment-request-updated",
  "payment-created",
  "payment-updated",
];

export class WebhookSignatureError extends Error {
  override name = "WebhookSignatureError";
  constructor(message = "Webhook signature verification failed") {
    super(message);
  }
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string | undefined | null,
  secret: string
): boolean {
  if (!signature || typeof signature !== "string") return false;
  if (!secret) return false;

  const rawPayload =
    typeof payload === "string" ? Buffer.from(payload, "utf8") : payload;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawPayload)
    .digest("hex");

  const received = signature.startsWith(SIGNATURE_PREFIX)
    ? signature.slice(SIGNATURE_PREFIX.length)
    : signature;

  if (received.length !== 64 || !/^[a-f0-9]+$/i.test(received)) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(received, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string | undefined | null,
  secret: string
): WebhookEventMap {
  if (!verifyWebhookSignature(payload, signature, secret)) {
    throw new WebhookSignatureError();
  }
  const raw = typeof payload === "string" ? payload : payload.toString("utf8");
  let body: { event?: string; data?: unknown };
  try {
    body = JSON.parse(raw) as { event?: string; data?: unknown };
  } catch {
    throw new WebhookSignatureError("Invalid webhook payload");
  }
  if (body == null || typeof body.event !== "string") {
    throw new WebhookSignatureError("Invalid webhook payload");
  }
  if (!WEBHOOK_EVENT_NAMES.includes(body.event as WebhookEventName)) {
    throw new WebhookSignatureError("Invalid webhook payload");
  }
  return {
    event: body.event as WebhookEventName,
    data: body.data,
  } as WebhookEventMap;
}
