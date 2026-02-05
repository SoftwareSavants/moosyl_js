/**
 * Example app to test the moosyl package locally.
 * Uses the linked package from the parent folder (no publish needed).
 * Loads env from example/.env (MOOSYL_API_KEY, TRANSACTION_ID, etc.).
 *
 * Usage:
 *   npm start              - run all: methods + request + pay + manualPay (skip if env missing)
 *   npm run test:methods   - fetch payment methods only
 *   npm run test:request   - fetch payment request only (requires TRANSACTION_ID)
 *   npm run test:pay       - pay() only (requires TRANSACTION_ID, PHONE_NUMBER, PASS_CODE, PAYMENT_METHOD_ID)
 *   npm run test:manual    - manualPay() only (requires TRANSACTION_ID, PAYMENT_METHOD_ID)
 *
 * Note: From repo root run `npm run build` first so that the example uses the built dist/.
 */

import 'dotenv/config';
import { Moosyl, PaymentMethodTitles } from 'moosyl';

const API_KEY = process.env.MOOSYL_API_KEY || 'pk_test_placeholder';
const TRANSACTION_ID = process.env.TRANSACTION_ID;
const PHONE_NUMBER = process.env.PHONE_NUMBER;
const PASS_CODE = process.env.PASS_CODE;
const PAYMENT_METHOD_ID = process.env.PAYMENT_METHOD_ID;
const isTestingMode = true;

const moosyl = new Moosyl(API_KEY);

async function testPaymentMethods(): Promise<void> {
  console.log('\n--- Get payment methods ---');
  try {
    const methods = await moosyl.getPaymentMethods(isTestingMode);
    console.log('Count:', methods.length);
    methods.forEach((m, i) => {
      const title = PaymentMethodTitles[m.method] ?? m.method;
      const extra =
        'bPayNumber' in m && m.bPayNumber != null
          ? ` bPay: ${m.bPayNumber}`
          : 'merchantCode' in m && m.merchantCode != null
            ? ` merchantCode: ${m.merchantCode}`
            : '';
      console.log(`  ${i + 1}. ${title} (${m.type}) id=${m.id}${extra}`);
    });
  } catch (e) {
    console.error('Error:', (e as Error).message);
    if (API_KEY === 'pk_test_placeholder')
      console.log('Tip: set MOOSYL_API_KEY for a real request.');
  }
}

async function testPaymentRequest(): Promise<void> {
  if (!TRANSACTION_ID) {
    console.log('\n--- Get payment request (skipped: no TRANSACTION_ID) ---');
    return;
  }
  console.log('\n--- Get payment request ---');
  try {
    const request = await moosyl.getPaymentRequest(TRANSACTION_ID);
    console.log('Id:', request.id);
    console.log('Amount:', request.amount);
    console.log('Phone:', request.phoneNumber ?? '—');
  } catch (e) {
    console.error('Error:', (e as Error).message);
  }
}

async function testPay(): Promise<void> {
  if (!TRANSACTION_ID || !PHONE_NUMBER || !PASS_CODE || !PAYMENT_METHOD_ID) {
    console.log(
      '\n--- Pay (skipped: set TRANSACTION_ID, PHONE_NUMBER, PASS_CODE, PAYMENT_METHOD_ID) ---'
    );
    return;
  }
  console.log('\n--- Pay ---');
  try {
    await moosyl.pay(TRANSACTION_ID, PHONE_NUMBER, PASS_CODE, PAYMENT_METHOD_ID);
    console.log('Pay request sent successfully.');
  } catch (e) {
    console.error('Error:', (e as Error).message);
  }
}

async function testManualPay(): Promise<void> {
  if (!TRANSACTION_ID || !PAYMENT_METHOD_ID) {
    console.log(
      '\n--- Manual pay (skipped: set TRANSACTION_ID, PAYMENT_METHOD_ID) ---'
    );
    return;
  }
  console.log('\n--- Manual pay ---');
  const dummyImage = {
    name: 'proof.png',
    data: Buffer.from('dummy image bytes'),
    type: 'image/png',
  };
  try {
    await moosyl.manualPay(TRANSACTION_ID, PAYMENT_METHOD_ID, dummyImage);
    console.log('Manual pay request sent successfully.');
  } catch (e) {
    console.error('Error:', (e as Error).message);
  }
}

const cmd = process.argv[2];
if (cmd === 'methods') {
  await testPaymentMethods();
} else if (cmd === 'request') {
  await testPaymentRequest();
} else if (cmd === 'pay') {
  await testPay();
} else if (cmd === 'manual') {
  await testManualPay();
} else {
  await testPaymentMethods();
  await testPaymentRequest();
  await testPay();
  await testManualPay();
}
