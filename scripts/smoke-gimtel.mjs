// Sandbox smoke test for the Gimtel payment flow, run through the BUILT
// package (dist/, imported by package name) against the real Moosyl API.
//
//   MOOSYL_SANDBOX_PUBLISHABLE_KEY=... MOOSYL_SANDBOX_SECRET_KEY=... npm run smoke
//
// Optional: MOOSYL_BASE_URL (default https://api.moosyl.com).
//
// Exit codes: 0 = passed or skipped (keys missing), 1 = a check failed,
// 2 = refused (a key looks live or does not belong to a sandbox environment).
// Keys are never printed.

import { randomInt, randomUUID } from "node:crypto";

const DEFAULT_BASE_URL = "https://api.moosyl.com";
const POLL_INTERVAL_MS = 2_000;
const COMPLETION_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 30_000;

// Moosyl keys carry no environment prefix today, but refuse the Stripe-style
// live prefixes the docs mention in case they are ever introduced.
const LIVE_PREFIX = /^([a-z]+_)?live_/i;

class CheckFailed extends Error {}
class Refused extends Error {}

const results = [];

async function step(name, body, detail) {
  const started = performance.now();
  try {
    const value = await body();
    const ms = Math.round(performance.now() - started);
    const text = detail ? detail(value) : "";
    results.push({ name, passed: true, ms });
    console.log(`  ok   ${name} (${ms} ms)${text ? ` - ${text}` : ""}`);
    return value;
  } catch (error) {
    if (error instanceof Refused) throw error;
    const ms = Math.round(performance.now() - started);
    results.push({ name, passed: false, ms });
    console.log(`  FAIL ${name} (${ms} ms) - ${describe(error)}`);
    throw error;
  }
}

function expect(condition, message) {
  if (!condition) throw new CheckFailed(message);
}

function describe(error) {
  if (error && error.name === "AppException") {
    return error.status
      ? `HTTP ${error.status}: ${error.message}`
      : `${error.code}: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

const digits = (count) =>
  Array.from({ length: count }, () => randomInt(10)).join("");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Raw `GET /configuration`, independent of the SDK under test: the safety
 * guard must not depend on the client's parsing (which, for example, skips
 * unknown method types and does not expose organizationId).
 */
async function rawConfigurations(baseUrl, apiKey) {
  const response = await fetch(`${baseUrl}/configuration`, {
    headers: { Authorization: apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new CheckFailed(`GET /configuration: HTTP ${response.status}: ${text}`);
  }
  const list = JSON.parse(text)?.data;
  if (!Array.isArray(list)) throw new CheckFailed("GET /configuration: no data array");
  return list;
}

/**
 * The SDK has no method to create payment requests (backend-only, secret key),
 * so this one call is plain HTTP, mirroring the README's cURL example.
 */
async function createPaymentRequest(baseUrl, secretKey, body) {
  const response = await fetch(`${baseUrl}/payment-request`, {
    method: "POST",
    headers: { Authorization: secretKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new CheckFailed(`POST /payment-request: HTTP ${response.status}: ${text}`);
  }
  return JSON.parse(text).data;
}

async function run({ baseUrl, publishableKey, secretKey, Moosyl, RootMoosyl, AppException }) {
  const options = { baseUrl, timeoutMs: REQUEST_TIMEOUT_MS };
  const client = new Moosyl(publishableKey, options);

  // 1. Both keys must belong to the same sandbox environment. The API has no
  //    key prefixes, so check what it says about each key's environment before
  //    creating anything. Read-only.
  await step(
    "sandbox guard (both keys resolve to the same sandbox environment)",
    async () => {
      const [pub, sec] = await Promise.all([
        rawConfigurations(baseUrl, publishableKey),
        rawConfigurations(baseUrl, secretKey),
      ]);
      if (pub.length === 0 || sec.length === 0) {
        throw new Refused(
          `The API returned no payment configurations for the ${pub.length === 0 ? "publishable" : "secret"} key, ` +
            "so the environment cannot be confirmed as sandbox. Enable a Gimtel method (Bankily, BCI Pay or Amanty) " +
            "for this organization in the Moosyl dashboard (sandbox environment).",
        );
      }
      if ([...pub, ...sec].some((c) => c.isTestingMode !== true)) {
        throw new Refused(
          "A key belongs to a production environment. Use the keys of the sandbox environment.",
        );
      }
      const orgs = new Set([...pub, ...sec].map((c) => c.organizationId));
      const pubIds = new Set(pub.map((c) => c.id));
      const sameIds = pubIds.size === new Set(sec.map((c) => c.id)).size && sec.every((c) => pubIds.has(c.id));
      if (orgs.size !== 1 || !sameIds) {
        throw new Refused(
          "The publishable and secret keys belong to different organizations or environments.",
        );
      }
      return pub;
    },
    (list) => `${list.length} sandbox configuration(s)`,
  );

  // 2. Payment request (secret key). Random amount and phone: a pending Gimtel
  //    payment with the same phone and amount in this organization would be
  //    superseded (cancelled), so concurrent runs (Dart and JS CI) must not share them.
  const transactionId = `smoke-${Date.now()}-${digits(6)}`;
  const amount = 100 + randomInt(900);
  const phone = `2${digits(7)}`;
  await step(
    "create payment request (secret key, plain HTTP)",
    async () => {
      const request = await createPaymentRequest(baseUrl, secretKey, { transactionId, amount });
      expect(request?.transactionId === transactionId, `transactionId ${request?.transactionId} != ${transactionId}`);
      expect(request.amount === amount, `amount ${request.amount} != ${amount}`);
      // Read it back through the SDK with the publishable key.
      const fetched = await client.getPaymentRequest(transactionId);
      expect(fetched.amount === amount, `getPaymentRequest amount ${fetched.amount} != ${amount}`);
      return request;
    },
    () => `transactionId=${transactionId} amount=${amount}`,
  );

  // 3. Pick a Gimtel method through the SDK.
  const method = await step(
    "getPaymentMethods -> pick a Gimtel method",
    async () => {
      const methods = await client.getPaymentMethods();
      const gimtel = methods.filter((m) => m.integration === "gimtel");
      if (gimtel.length === 0) {
        throw new CheckFailed(
          "No Gimtel payment method in this sandbox environment. Add a Gimtel configuration to the sandbox " +
            "environment of this org (enable Bankily, BCI Pay or Amanty via Gimtel in the dashboard; the " +
            "platform must have a sandbox Gimtel configuration).",
        );
      }
      expect(gimtel.every((m) => m.isTestingMode), "a Gimtel method is not in testing mode");
      for (const type of ["bankily", "bci_pay", "amanty"]) {
        const found = gimtel.find((m) => m.method === type);
        if (found) return found;
      }
      return gimtel[0];
    },
    (m) => `${m.method} (${m.id})`,
  );

  // 4. Pay without a passcode.
  const payment = await step(
    "pay (Gimtel, no passCode)",
    async () => {
      const result = await client.pay({ configurationId: method.id, transactionId, phoneNumber: phone });
      expect(result.status === "pending", `status ${result.status} != pending`);
      const i = result.instructions;
      expect(i, "instructions missing");
      expect(i.kind === "gimtel_transfer", `instructions.kind ${i.kind}`);
      expect(i.receivingPhone, "instructions.receivingPhone empty");
      expect(i.receivingBank, "instructions.receivingBank empty");
      expect(i.amount === amount, `instructions.amount ${i.amount} != ${amount}`);
      expect(i.payerPhone === phone, `instructions.payerPhone ${i.payerPhone} != ${phone}`);
      expect(i.paymentId === result.id, `instructions.paymentId ${i.paymentId} != ${result.id}`);
      expect(!Number.isNaN(Date.parse(i.claimExpiresAt)), `instructions.claimExpiresAt "${i.claimExpiresAt}" is not a date`);
      return result;
    },
    (p) => `payment ${p.id}`,
  );

  // 5. Status, simulate, poll until completed.
  await step("status right after pay is pending", async () => {
    const status = await client.getPaymentStatus(payment.id);
    expect(status.status === "pending", `status ${status.rawStatus} != pending`);
  });

  let simulatedAt = 0;
  let completedAfterMs = 0;
  await step(
    "simulateTransfer",
    async () => {
      simulatedAt = performance.now();
      const { outcome } = await client.simulateTransfer(payment.id);
      expect(outcome === "matched", `outcome ${outcome} != matched`);
      return outcome;
    },
    (outcome) => `outcome ${outcome}`,
  );

  await step(
    "poll status until completed",
    async () => {
      const deadline = Date.now() + COMPLETION_TIMEOUT_MS;
      for (let polls = 1; ; polls++) {
        const status = await client.getPaymentStatus(payment.id);
        if (status.status === "completed") {
          completedAfterMs = Math.round(performance.now() - simulatedAt);
          return polls;
        }
        expect(status.rawStatus === "pending", `status became ${status.rawStatus}`);
        if (Date.now() > deadline) {
          throw new CheckFailed(`not completed after ${COMPLETION_TIMEOUT_MS / 1000} s (still ${status.rawStatus})`);
        }
        await sleep(POLL_INTERVAL_MS);
      }
    },
    (polls) => `simulate -> completed in ${completedAfterMs} ms (${polls} poll(s))`,
  );

  // 6. Negative checks: errors reject with AppException carrying status + backend message.
  await step(
    "unknown payment id -> 404 with message",
    async () => {
      try {
        await client.getPaymentStatus(randomUUID());
      } catch (e) {
        expect(e instanceof AppException, `expected AppException, got ${describe(e)}`);
        expect(e.status === 404, `expected HTTP 404, got ${describe(e)}`);
        expect(e.isClientError, "isClientError false for a 404");
        expect(e.message, "empty error message");
        return e.message;
      }
      throw new CheckFailed("expected an error, got a status response");
    },
    (m) => `"${m}"`,
  );

  await step(
    "invalid API key -> 401 with message (root entry)",
    async () => {
      const bad = new RootMoosyl(`smoke-invalid-${digits(12)}`, options);
      try {
        await bad.getPaymentMethods();
      } catch (e) {
        expect(e?.name === "AppException", `expected AppException, got ${describe(e)}`);
        expect(e.status === 401, `expected HTTP 401, got ${describe(e)}`);
        expect(e.message, "empty error message");
        return e.message;
      }
      throw new CheckFailed("expected an error, got payment methods");
    },
    (m) => `"${m}"`,
  );
}

function printSummary() {
  if (results.length === 0) return;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.reduce((sum, r) => sum + r.ms, 0);
  console.log("");
  console.log(
    failed === 0
      ? `PASS: ${results.length} check(s) in ${total} ms`
      : `FAIL: ${failed} of ${results.length} check(s) failed (${total} ms)`,
  );
}

async function main() {
  console.log("Moosyl Gimtel sandbox smoke test (JS, moosyl-sdk from dist/)");

  const publishableKey = (process.env.MOOSYL_SANDBOX_PUBLISHABLE_KEY ?? "").trim();
  const secretKey = (process.env.MOOSYL_SANDBOX_SECRET_KEY ?? "").trim();
  const baseUrl = ((process.env.MOOSYL_BASE_URL ?? "").trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");

  const missing = [
    !publishableKey && "MOOSYL_SANDBOX_PUBLISHABLE_KEY",
    !secretKey && "MOOSYL_SANDBOX_SECRET_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    console.log(`SKIPPED: missing env ${missing.join(", ")}`);
    return 0;
  }

  const live = [
    LIVE_PREFIX.test(publishableKey) && "MOOSYL_SANDBOX_PUBLISHABLE_KEY",
    LIVE_PREFIX.test(secretKey) && "MOOSYL_SANDBOX_SECRET_KEY",
  ].filter(Boolean);
  if (live.length > 0) {
    console.error(`REFUSED: ${live.join(", ")} looks like a live key. This test only runs against sandbox keys.`);
    return 2;
  }

  // The flow uses the React Native / browser-safe entry that mobile apps get;
  // the root entry (Node, with webhook helpers) is used for the invalid-key check.
  const { Moosyl, AppException } = await import("moosyl-sdk/client");
  const { Moosyl: RootMoosyl } = await import("moosyl-sdk");

  console.log(`API: ${baseUrl}`);
  try {
    await run({ baseUrl, publishableKey, secretKey, Moosyl, RootMoosyl, AppException });
    return 0;
  } catch (error) {
    if (error instanceof Refused) {
      console.error(`REFUSED: ${error.message}`);
      return 2;
    }
    return 1;
  } finally {
    printSummary();
  }
}

process.exitCode = await main();
