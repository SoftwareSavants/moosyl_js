# Moosyl JavaScript SDK

[![npm version](https://img.shields.io/npm/v/moosyl-sdk.svg)](https://www.npmjs.com/package/moosyl-sdk)

The **Moosyl JavaScript SDK** helps you integrate payment solutions with Mauritania's popular banking apps—such as **Bankily**, **Sedad**, and **Masrivi**—in Node.js, React Native or the browser. Use it to fetch available payment methods, payment request details, and process payments via the Moosyl API.

---

## Features

- **Payment methods**: Fetch available payment methods (including testing mode).
- **Payment request**: Get payment request details by transaction ID.
- **Pay**: Process payments (e.g. Bankily).
- **Gimtel payments**: Bank-transfer payments with typed transfer instructions, status polling and a sandbox simulator.
- **React Native**: `moosyl-sdk/client` has no Node-only dependencies.
- **Checkout session**: Create a hosted checkout session from your backend.
- **Webhook verification**: Verify webhook signatures (HMAC-SHA256) like Stripe.
- **Lightweight**: No UI; use your own front end or backend flows.
- **ESM**: Native ES modules (`import`).

---

## Getting Started

### Installation

Install the package:

```bash
npm install moosyl-sdk
```

### Create a Moosyl instance

Create a single client with your publishable API key. All operations use this instance:

```javascript
import { Moosyl, PaymentMethodTitles } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");
```

---

## Usage

All functionality is available on the **Moosyl** instance: `moosyl.getPaymentMethods()`, `moosyl.getPaymentRequest()`, `moosyl.pay()`, `moosyl.getPaymentStatus()`, `moosyl.simulateTransfer()`, `moosyl.createCheckoutSession()`.

### Fetch payment methods

Get the list of payment methods (e.g. to show options to the user):

```javascript
import { Moosyl, PaymentMethodTitles } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");
const methods = await moosyl.getPaymentMethods(true); // true = testing mode

methods.forEach((m) => {
  const title = PaymentMethodTitles[m.method] ?? m.method;
  console.log(title, m.id, m.integration); // integration: "native" | "gimtel"
  // Bankily/Sedad/etc. may expose m.bPayNumber
});
```

Each method has `integration` (`"native"` or `"gimtel"`, `"native"` when the backend does not say) and `isTestingMode`. Methods of a type that your SDK version does not know are skipped. Omit the argument (`getPaymentMethods()`) to let the API key's environment decide.

### Fetch payment request details

Get details for a given transaction (after creating a payment request from your backend):

```javascript
import { Moosyl } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");
const request = await moosyl.getPaymentRequest("TRANSACTION_ID");

console.log(request.id, request.amount, request.phoneNumber);
```

### Create a payment request (backend)

Payment requests are created on your backend with your **secret API key**. The SDK does not create them; it only fetches payment methods and payment request details. Example with cURL:

```bash
curl -X POST https://api.moosyl.com/payment-request \
  -H "Authorization: YOUR_SECRET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+22212345678",
    "transactionId": "your-unique-transaction-id",
    "amount": 5000
  }'
```

Once created, use the returned **transactionId** with `moosyl.getPaymentRequest()` and your payment flow.

### Create checkout session (backend only)

This endpoint requires your **secret API key** and must be called from your backend only. Do not expose your secret key in frontend code.

```javascript
import { Moosyl } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_SECRET_API_KEY");

const response = await moosyl.createCheckoutSession({
  paymentRequestId: "123e4567-e89b-12d3-a456-426614174000",
  transactionId: "your-unique-transaction-id",
  amount: 5000,
  phoneNumber: "+22212345678",
  successUrl: "https://example.com/success",
  cancelUrl: "https://example.com/cancel",
  expiresInMinutes: 5,
});

console.log(response.data.id);
console.log(response.checkoutUrl);
```

Equivalent cURL:

```bash
curl https://api.moosyl.com/checkout-session \
  --request POST \
  --header 'Authorization: YOUR_SECRET_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
  "paymentRequestId": "",
  "transactionId": "",
  "amount": 0,
  "phoneNumber": "",
  "successUrl": "",
  "cancelUrl": "",
  "expiresInMinutes": 5
}'
```

### Process payment

For payment methods (e.g. Bankily):

```javascript
import { Moosyl } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");

await moosyl.pay(
  "TRANSACTION_ID",
  "+22212345678",
  "PASSCODE",
  "PAYMENT_METHOD_ID", // configuration ID from getPaymentMethods()
);
```

### Gimtel payments

With Gimtel methods (`method.integration === "gimtel"`) the payer sends a bank transfer to Moosyl from their own bank app, and Moosyl matches the transfer. There is no passcode.

1. **Create the payment** without `passCode`. The response includes `instructions`: the receiving phone/bank and the exact amount.
2. **Show the instructions** and let the payer make the transfer in their bank app.
3. **Poll `getPaymentStatus()` about every 4 seconds** while the payer is on the payment screen. Each call is a heartbeat: the payment stops being claimable about 10 minutes after the last poll (see `claimExpiresAt`). Stop when the status is `completed` (success) or `expired` / `cancelled` / `failed`.

```javascript
import { Moosyl, AppException } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");

const payment = await moosyl.pay({
  configurationId: method.id, // a method with integration === "gimtel"
  transactionId: "TRANSACTION_ID",
  phoneNumber: "33333333", // the phone the payer transfers from
  // no passCode for Gimtel
});

if (!payment.instructions) {
  // Not a Gimtel method (or an unexpected response): handle payment.status instead.
  throw new Error(`No transfer instructions (status: ${payment.status})`);
}
const { receivingPhone, receivingBank, amount, claimExpiresAt } = payment.instructions;
showInstructions({ receivingPhone, receivingBank, amount, claimExpiresAt });

let expiresAt = Date.parse(claimExpiresAt);
const timer = setInterval(async () => {
  if (Date.now() > expiresAt) {
    clearInterval(timer);
    return onFailed("expired");
  }
  try {
    const res = await moosyl.getPaymentStatus(payment.id);
    if (res.claimExpiresAt) expiresAt = Date.parse(res.claimExpiresAt); // heartbeats extend it
    if (res.status === "completed") {
      clearInterval(timer);
      onPaid();
    } else if (res.status !== "pending") {
      clearInterval(timer);
      onFailed(res.status); // "expired" | "cancelled" | "failed"
    }
  } catch (e) {
    if (e instanceof AppException && e.isClientError) {
      // 4xx (bad key, unknown payment...): retrying will not help.
      clearInterval(timer);
      onFailed(e.code);
    }
    // Network errors, timeouts and 5xx are transient: keep polling.
  }
}, 4000);
```

`getPaymentStatus()` resolves to `{ id, status, rawStatus, referenceId, claimExpiresAt }`. `status` is always one of `pending | completed | expired | cancelled | failed`. A status string this SDK version does not know comes back as `"pending"`, so a poller keeps going and never mistakes it for a final status. The backend's original value is in `rawStatus`.

**Sandbox:** magic phone numbers do not complete Gimtel payments. Call `simulateTransfer()` to act out the payer's transfer, then keep polling as usual:

```javascript
const { outcome } = await moosyl.simulateTransfer(payment.id); // "matched" | "unmatched" | "skipped"
```

The positional `moosyl.pay(transactionId, phoneNumber, passCode, paymentMethodId)` form still works and returns the raw response. Pass `undefined` as `passCode` for Gimtel.

### React Native and browsers

The package root includes the webhook helpers, which use `node:crypto`. For React Native (and browser bundles), import the client entry. It has the same API minus `verifyWebhookSignature` / `constructWebhookEvent`, and imports no Node modules:

```javascript
import { Moosyl, AppException } from "moosyl-sdk/client";
```

Plain `import { Moosyl } from "moosyl-sdk"` also resolves to this entry, with matching types:

- **React Native (Metro)**: through the `react-native` export condition.
- **Browser bundlers (including Expo web)**: through the `browser` condition.

Cloudflare Workers (`workerd`/`worker`) and Vercel Edge (`edge-light`) keep the full entry. `moosyl-sdk/client` works on older Metro versions without package-exports support, through a `client/package.json` stub. The client only needs global `fetch`, `AbortController` and `setTimeout`.

### Errors and timeouts

Every method rejects with an `AppException`:

- `message`: the backend's `message`, or a generic text.
- `code`: the backend's `code`, or `timeout`, `abort_error`, `connection_error` or `unknown`.
- `status`: the HTTP status, when the error came from a response.

Requests are aborted after 60 s (code `timeout`). You can change the timeout and the base URL:

```javascript
const moosyl = new Moosyl("KEY", { timeoutMs: 30_000, baseUrl: "https://api.moosyl.com" });
```

### Verify webhooks

Use the **raw request body** (before JSON parsing) and the `x-webhook-signature` header. Requires your **webhook secret** (server-side only). `constructWebhookEvent` returns a type-safe `{ event, data }` so `data` is narrowed by `event`.

```javascript
import { Moosyl, WebhookSignatureError } from "moosyl-sdk";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const rawBody = req.body;

  try {
    const { event, data } = moosyl.constructWebhookEvent(
      rawBody,
      signature,
      process.env.WEBHOOK_SECRET,
    );
    switch (event) {
      case "payment-created":
      case "payment-updated":
        handlePayment(data);
        break;
      case "payment-request-created":
      case "payment-request-updated":
        handlePaymentRequest(data);
        break;
    }
    res.json({ received: true });
  } catch (e) {
    if (e instanceof WebhookSignatureError) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    throw e;
  }
});
```

To only verify without parsing: `moosyl.verifyWebhookSignature(rawBody, signature, secret)` returns `true` or `false`.

---

## Configuration

- **API key**: Use your **publishable** API key when creating `new Moosyl(apiKey)`. Get keys at [moosyl.com](https://moosyl.com).
- **Secret API key**: `createCheckoutSession()` uses the key passed to `new Moosyl(apiKey)`. For this method, initialize Moosyl with your **secret** key and run only on trusted backend infrastructure.
- **Webhook secret**: Use your webhook signing secret with `moosyl.constructWebhookEvent()` / `moosyl.verifyWebhookSignature()`; keep it server-side only.
- **Testing mode**: Pass `true` to `moosyl.getPaymentMethods(true)` for test configuration.
- **Options**: `new Moosyl(apiKey, { baseUrl, timeoutMs })`. The defaults are `https://api.moosyl.com` and 60 000 ms.

---

## Documentation

For more guides and API details, see [docs.moosyl.com](https://docs.moosyl.com).

---

## Contributing

1. Fork this repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Add feature'`).
4. Push to your branch (`git push origin feature-name`).
5. Open a pull request.

---

## Support

- [moosyl.com](https://moosyl.com)
- support@moosyl.com
- [GitHub Issues](https://github.com/SoftwareSavants/moosyl_js/issues)

---

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

**Integrate Moosyl into your Node or web app.**  
Get started at [moosyl.com](https://moosyl.com).
