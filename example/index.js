/**
 * Example app to test the moosyl package locally.
 * Uses the linked package from the parent folder (no publish needed).
 * Loads env from example/.env (MOOSYL_API_KEY, TRANSACTION_ID).
 *
 * Usage:
 *   npm start              - run both: payment methods + payment request (if TRANSACTION_ID set)
 *   npm run test:methods   - fetch payment methods only
 *   npm run test:request   - fetch payment request only (requires TRANSACTION_ID)
 */

import 'dotenv/config';
import {
  GetPaymentMethodsService,
  GetPaymentRequestService,
  PaymentMethodTitles,
} from 'moosyl';

const API_KEY = process.env.MOOSYL_API_KEY || 'pk_test_placeholder';
const TRANSACTION_ID = process.env.TRANSACTION_ID;
const isTestingMode = true;

async function testPaymentMethods() {
  console.log('\n--- Get payment methods ---');
  const service = new GetPaymentMethodsService(API_KEY);
  try {
    const methods = await service.get(isTestingMode);
    console.log('Count:', methods.length);
    methods.forEach((m, i) => {
      const title = PaymentMethodTitles[m.method] ?? m.method;
      const extra =
        m.bPayNumber != null
          ? ` bPay: ${m.bPayNumber}`
          : m.merchantCode != null
            ? ` merchantCode: ${m.merchantCode}`
            : '';
      console.log(`  ${i + 1}. ${title} (${m.type}) id=${m.id}${extra}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
    if (API_KEY === 'pk_test_placeholder')
      console.log('Tip: set MOOSYL_API_KEY for a real request.');
  }
}

async function testPaymentRequest() {
  if (!TRANSACTION_ID) {
    console.log('\n--- Get payment request (skipped: no TRANSACTION_ID) ---');
    return;
  }
  console.log('\n--- Get payment request ---');
  const service = new GetPaymentRequestService(API_KEY);
  try {
    const request = await service.get(TRANSACTION_ID);
    console.log('Id:', request.id);
    console.log('Amount:', request.amount);
    console.log('Phone:', request.phoneNumber ?? '—');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

const cmd = process.argv[2];
if (cmd === 'methods') {
  await testPaymentMethods();
} else if (cmd === 'request') {
  await testPaymentRequest();
} else {
  await testPaymentMethods();
  await testPaymentRequest();
}
