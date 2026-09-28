/**
 * Moosyl JS – integrating payment solutions with Mauritania's popular banking apps.
 *
 * This entry includes the webhook helpers, which need `node:crypto`. React
 * Native / browser code should use `moosyl-sdk/client` (Metro picks it
 * automatically through the `react-native` export condition).
 */

// Everything from the RN/browser-safe entry...
export * from "./client.js";

// ...plus the full client (with webhook helpers) and webhook verification.
// This explicit export takes precedence over the `Moosyl` alias re-exported above.
export { Moosyl } from "./src/moosyl.js";
export { WebhookSignatureError } from "./src/helpers/webhook.js";
