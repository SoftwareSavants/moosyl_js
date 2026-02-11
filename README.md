# Moosyl JavaScript SDK

[![npm version](https://img.shields.io/npm/v/moosyl.svg)](https://www.npmjs.com/package/moosyl)

The **Moosyl JavaScript SDK** helps you integrate payment solutions with Mauritania's popular banking apps—such as **Bankily**, **Sedad**, and **Masrivi**—in Node.js or the browser. Use it to fetch available payment methods, payment request details, and process payments via the Moosyl API.

---

## Features

- **Payment methods**: Fetch available payment methods (including testing mode).
- **Payment request**: Get payment request details by transaction ID.
- **Pay**: Process payments (e.g. Bankily).
- **Lightweight**: No UI; use your own front end or backend flows.
- **ESM**: Native ES modules (`import`).

---

## Getting Started

### Installation

Install the package:

```bash
npm install moosyl
```

### Create a Moosyl instance

Create a single client with your publishable API key. All operations use this instance:

```javascript
import { Moosyl, PaymentMethodTitles } from "moosyl";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");
```

---

## Usage

All functionality is available on the **Moosyl** instance: `moosyl.getPaymentMethods()`, `moosyl.getPaymentRequest()`, `moosyl.pay()`.

### Fetch payment methods

Get the list of payment methods (e.g. to show options to the user):

```javascript
import { Moosyl, PaymentMethodTitles } from "moosyl";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");
const methods = await moosyl.getPaymentMethods(true); // true = testing mode

methods.forEach((m) => {
  const title = PaymentMethodTitles[m.method] ?? m.method;
  console.log(title, m.type, m.id);
  // Bankily/Sedad/etc. may expose m.bPayNumber or m.merchantCode
});
```

### Fetch payment request details

Get details for a given transaction (after creating a payment request from your backend):

```javascript
import { Moosyl } from "moosyl";

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

### Process payment

For payment methods (e.g. Bankily):

```javascript
import { Moosyl } from "moosyl";

const moosyl = new Moosyl("YOUR_PUBLISHABLE_API_KEY");

await moosyl.pay(
  "TRANSACTION_ID",
  "+22212345678",
  "PASSCODE",
  "PAYMENT_METHOD_ID", // configuration ID from getPaymentMethods()
);
```

---

## Configuration

- **API key**: Use your **publishable** API key when creating `new Moosyl(apiKey)`. Get keys at [moosyl.com](https://moosyl.com).
- **Testing mode**: Pass `true` to `moosyl.getPaymentMethods(true)` for test configuration.

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
