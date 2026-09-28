# Changelog

## 1.2.0

Additive release: existing code keeps working unchanged.

### Added

- **Gimtel payments.**
  - `pay({ configurationId, transactionId, phoneNumber, passCode? })`: object
    form that returns a typed `PayResult` (`id`, `status`, `referenceId`,
    `metadata?`, `instructions?: GimtelInstructions`). `passCode` is left out
    of the request when undefined. The positional
    `pay(transactionId, phoneNumber, passCode, paymentMethodId)` form still
    returns the raw `FetcherResponse`, and now also accepts `undefined` for
    `passCode`.
  - `getPaymentStatus(paymentId)` returns `PaymentStatusResult`
    (`id`, `status`, `rawStatus`, `referenceId`, `claimExpiresAt`). Unknown
    statuses come back as `"pending"`; the original string is in `rawStatus`.
  - `simulateTransfer(paymentId)`: sandbox only, returns `{ outcome }`. It
    rejects with `AppException` if the backend sends an outcome other than
    `matched` / `unmatched` / `skipped`.
  - `instructions` is only set when `receivingPhone`, `paymentId` and a finite
    `amount` are present.
  - New types: `GimtelInstructions`, `GimtelPaymentStatus`, `PayParams`,
    `PayResult`, `PaymentStatusResult`, `SimulateTransferResult`,
    `SimulateTransferOutcome`, `PaymentMethodIntegration`.
- `PaymentMethod` has new `integration` (`"native"` | `"gimtel"`, defaults to
  `"native"`), `isTestingMode` and `isGimtel` fields.
- `new Moosyl(apiKey, { baseUrl?, timeoutMs? })`: optional client options.
  The default base URL (`https://api.moosyl.com`) and 60 s timeout are the same
  as before.
- **React Native / browser entry `moosyl-sdk/client`.** It has the whole API
  client (`Moosyl`, also exported as `MoosylClient`) without the webhook
  helpers, so it never imports `node:crypto`. `moosyl-sdk` itself resolves
  to this entry, types included, under the `react-native` and `browser`
  export conditions (and the top-level `react-native` field).
  Cloudflare Workers (`workerd`/`worker`) and Vercel Edge (`edge-light`) keep
  the full entry. A `client/package.json` stub makes `moosyl-sdk/client` work
  on Metro versions without package-exports support.
- Exports that were missing from the root entry: `AppException`,
  `AppExceptionCode`, `PaymentMethod`, `PaymentMethodTypes`,
  `PaymentMethodTitles`, `PaymentRequestModel`, `FetcherResponse`.
- Tests (`npm test`, node:test with a mocked `fetch`), also run in CI.

### Changed

- `getPaymentMethods(isTestingMode?)`: the argument is optional. When you
  leave it out, no `isTestingMode` query is sent and the API key's environment
  decides. Payment methods of a type this SDK version does not know are
  skipped. Before, one unknown type made the whole call throw.
- Request timeouts now use `AbortController` + `setTimeout` instead of
  `AbortSignal.timeout`, which React Native does not implement. A timeout
  still fails with `AppException` code `timeout`.
