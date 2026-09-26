// Runs against the built output (`npm test` builds first). Uses node:test and
// a mocked global fetch; no network, no extra dependencies.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Moosyl, AppException } from "../dist/client.js";
import { Moosyl as NodeMoosyl } from "../dist/index.js";

const BASE = "https://api.test.local";
const realFetch = globalThis.fetch;
let calls = [];

function mockFetch(handler) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const { status = 200, body } = await handler(String(url), init);
    return new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

const client = () => new Moosyl("pk_test_123", { baseUrl: `${BASE}/` });

test("pay() omits passCode when undefined and returns typed Gimtel instructions", async () => {
  mockFetch(() => ({
    body: {
      id: "pay_1",
      status: "pending",
      referenceId: null,
      metadata: { foo: "bar" },
      instructions: {
        kind: "gimtel_transfer",
        receivingPhone: "22123456",
        receivingBank: "BIM",
        amount: 1500,
        payerPhone: "33333333",
        paymentId: "pay_1",
        claimExpiresAt: "2026-09-26T10:00:00.000Z",
      },
    },
  }));

  const res = await client().pay({
    configurationId: "cfg_1",
    transactionId: "tx_1",
    phoneNumber: "33333333",
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${BASE}/payment`);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Authorization, "pk_test_123");
  const sent = JSON.parse(calls[0].init.body);
  assert.ok(!("passCode" in sent), "passCode key must not be sent");
  assert.deepEqual(sent, {
    transactionId: "tx_1",
    phoneNumber: "33333333",
    configurationId: "cfg_1",
  });

  assert.equal(res.id, "pay_1");
  assert.equal(res.status, "pending");
  assert.equal(res.referenceId, null);
  assert.deepEqual(res.metadata, { foo: "bar" });
  assert.equal(res.instructions?.receivingPhone, "22123456");
  assert.equal(res.instructions?.amount, 1500);
  assert.equal(res.instructions?.claimExpiresAt, "2026-09-26T10:00:00.000Z");
});

test("pay() sends passCode for native methods and has no instructions", async () => {
  mockFetch(() => ({ body: { data: { id: "pay_2", status: "completed", referenceId: "ref" } } }));
  const res = await client().pay({
    configurationId: "cfg",
    transactionId: "tx",
    phoneNumber: "22222222",
    passCode: "1234",
  });
  assert.equal(JSON.parse(calls[0].init.body).passCode, "1234");
  // `{ data: {...} }` envelope is unwrapped too.
  assert.equal(res.id, "pay_2");
  assert.equal(res.referenceId, "ref");
  assert.equal(res.instructions, undefined);
});

test("legacy positional pay() still returns the raw response", async () => {
  mockFetch(() => ({ body: { id: "pay_3", status: "pending", referenceId: null } }));
  const res = await client().pay("tx", "22222222", undefined, "cfg");
  assert.equal(res.status, 200);
  assert.equal(res.data.id, "pay_3");
  assert.ok(!("passCode" in JSON.parse(calls[0].init.body)));
});

test("getPaymentStatus() maps known statuses and falls back to pending for unknown ones", async () => {
  const statuses = ["completed", "expired", "cancelled", "failed", "pending", "refunded"];
  let i = 0;
  mockFetch(() => ({
    body: { id: "pay_1", status: statuses[i++], referenceId: null, claimExpiresAt: null },
  }));
  const results = [];
  for (let n = 0; n < statuses.length; n++) {
    results.push(await client().getPaymentStatus("pay/1"));
  }
  assert.deepEqual(
    results.map((r) => r.status),
    ["completed", "expired", "cancelled", "failed", "pending", "pending"],
  );
  assert.equal(results[5].rawStatus, "refunded");
  assert.equal(results[0].claimExpiresAt, null);
  assert.equal(calls[0].url, `${BASE}/payment/pay%2F1/status`);
  assert.equal(calls[0].init.method, "GET");
});

test("getPaymentStatus() keeps referenceId and claimExpiresAt", async () => {
  mockFetch(() => ({
    body: { id: "p", status: "completed", referenceId: "BIM-9", claimExpiresAt: "2026-09-26T10:00:00Z" },
  }));
  const r = await client().getPaymentStatus("p");
  assert.equal(r.referenceId, "BIM-9");
  assert.equal(r.claimExpiresAt, "2026-09-26T10:00:00Z");
});

test("simulateTransfer() POSTs to /payment/{id}/simulate-transfer", async () => {
  mockFetch(() => ({ body: { outcome: "matched" } }));
  const r = await client().simulateTransfer("pay_1");
  assert.equal(calls[0].url, `${BASE}/payment/pay_1/simulate-transfer`);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(r.outcome, "matched");
});

test("getPaymentMethods() defaults integration to native and skips unknown types", async () => {
  mockFetch(() => ({
    body: {
      data: [
        { id: "a", type: "bankily", integration: "gimtel", isTestingMode: true, config: { code: "B1" } },
        { id: "b", type: "sedad", config: {} },
        { id: "c", type: "some_future_bank", integration: "gimtel" },
        { id: "d", type: "amanty", integration: "weird", isTestingMode: false },
      ],
    },
  }));
  const methods = await client().getPaymentMethods();
  assert.equal(calls[0].url, `${BASE}/configuration`, "no query when isTestingMode is omitted");
  assert.deepEqual(
    methods.map((m) => [m.id, m.method, m.integration, m.isTestingMode]),
    [
      ["a", "bankily", "gimtel", true],
      ["b", "sedad", "native", false],
      ["d", "amanty", "native", false],
    ],
  );
  assert.equal(methods[0].bPayNumber, "B1");
  assert.equal(methods[0].isGimtel, true);

  await client().getPaymentMethods(true);
  assert.equal(calls[1].url, `${BASE}/configuration?isTestingMode=true`);
});

test("a 4xx with { message, code } surfaces message, code and status", async () => {
  mockFetch(() => ({ status: 422, body: { message: "Payment request expired", code: "payment_request_expired" } }));
  await assert.rejects(client().getPaymentStatus("x"), (err) => {
    assert.ok(err instanceof AppException);
    assert.equal(err.message, "Payment request expired");
    assert.equal(err.code, "payment_request_expired");
    assert.equal(err.status, 422);
    assert.equal(err.isClientError, true);
    return true;
  });
});

test("requests time out with code 'timeout' and the timer does not keep the process alive", async () => {
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const e = new Error("This operation was aborted");
        e.name = "AbortError";
        reject(e);
      });
    });
  const slow = new Moosyl("k", { baseUrl: BASE, timeoutMs: 20 });
  await assert.rejects(slow.simulateTransfer("p"), (err) => {
    assert.ok(err instanceof AppException);
    assert.equal(err.code, "timeout");
    assert.equal(err.isTimeout, true);
    return true;
  });
});

test("network failures surface as connection_error", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Network request failed");
  };
  await assert.rejects(client().getPaymentMethods(), (err) => err.code === "connection_error");
});

test("root entry Moosyl has the same API plus webhook helpers", async () => {
  mockFetch(() => ({ body: { id: "p", status: "completed", referenceId: null, claimExpiresAt: null } }));
  const m = new NodeMoosyl("k", { baseUrl: BASE });
  assert.equal((await m.getPaymentStatus("p")).status, "completed");
  assert.equal(typeof m.constructWebhookEvent, "function");
  assert.equal(typeof new Moosyl("k").constructWebhookEvent, "undefined");
});

test("default base URL is unchanged for existing callers", async () => {
  mockFetch(() => ({ body: { data: [] } }));
  await new NodeMoosyl("k").getPaymentMethods(false);
  assert.equal(calls[0].url, "https://api.moosyl.com/configuration?isTestingMode=false");
});
