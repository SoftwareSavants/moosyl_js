# Moosyl example

This folder is a **local test app** for the `moosyl` package. It uses the package from the parent directory via `"moosyl": "file:.."`, so you can test changes without publishing to npm.

## Setup (one time)

From the **repo root**, build the package and set up the example:

```bash
npm run build          # compile TypeScript to dist/
cd example
npm install
cp .env.example .env
# Edit .env and set MOOSYL_API_KEY=your_key (and optionally TRANSACTION_ID, etc.)
```

This installs the parent package (linked to your local `dist/`). The example runs with **tsx** (TypeScript). The `.env` file is gitignored; copy from `.env.example` and add your keys.

## Run

From the `example` folder:

```bash
# Test payment methods only (uses placeholder key if MOOSYL_API_KEY not set)
npm run test:methods

# Test payment request (requires TRANSACTION_ID)
MOOSYL_API_KEY=your_key TRANSACTION_ID=some_id npm run test:request

# Test pay (requires TRANSACTION_ID, PHONE_NUMBER, PASS_CODE, PAYMENT_METHOD_ID)
npm run test:pay

# Run all (skips pay if env vars missing)
npm start
```

With a real API key:

```bash
export MOOSYL_API_KEY=pk_your_key
npm start
```

For payment request you also need a transaction id:

```bash
export TRANSACTION_ID=your_transaction_id
npm run test:request
```

## Workflow

1. Edit code in the parent package (`src/`, `index.js`).
2. Run `npm start` or `npm run test:methods` in `example/` to verify.
3. No need to publish until you’re ready.
