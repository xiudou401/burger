# Synthetic Monthly Analytics Dataset: 28 October 2026

## Data Boundary

This is portfolio demonstration data, not real customers, payments or revenue.
It deliberately includes an abandonment spike to exercise operational alerts.
The normal analytics dashboard includes these records in its aggregates.

- Business dates: 28 September through 27 October 2026 (Australia/Sydney).
- Added: 392 synthetic orders, including 346 paid-status orders and 46
  cancelled orders with cancelled, failed or refunded payment statuses.
- Simulated paid revenue: A$11,178.20. No money was collected.
- Existing orders: 84; total after insertion: 476.
- All existing documents were read back and fingerprinted unchanged.
- A second apply inserted 0 and modified 0 documents; total stayed at 476.
- Owner: the existing disabled customer@burgerclub.test account. Its account,
  password, status and permissions were not changed.
- Every inserted order has a demo-month-v1-YYYY-MM-DD-NN checkout key and a
  demo_month_ provider ID. These are not real Stripe session IDs.
- All added orders are completed or cancelled, avoiding active kitchen work.
- No Stripe API calls, notifications, email or realtime events were emitted
  by seeding; inserts use the order model directly.

The monthly analytics probe reported 393 orders because one pre-existing
order also fell inside the application's 30-day range. Do not mistake those
aggregates for the isolated 392-order batch.

## Repeatable Script

From backend/, with the intended database configured:

```sh
npm run seed:demo-month
ALLOW_DEMO_ORDER_SEED=true npm run seed:demo-month -- --apply
```

The default mode validates prospective documents and reports counts without
inserting orders. Apply requires the explicit flag and environment guard.
The script requires the existing disabled demo customer and all five menu
categories. It never creates users, deletes records, backfills old documents
or updates existing orders. Existing user/key pairs are preserved using
$setOnInsert with timestamps disabled. Each date receives stable keys.

The date window is the preceding 30 complete Sydney dates, excluding today.
Tests cover daylight saving, unique deterministic keys, integer money totals,
historical terminal states, the intended anomaly, and invalid inputs.

## Real Model Verification

The existing application service functions were invoked as a maintenance
operation against the live database, with the existing active admin as the
actor for the AgentRun records. No session or password was created. This was
not a browser or HTTP authentication test.

- Monthly analysis: success, gpt-4o-mini; identified payment outcomes and item
  performance. The question explicitly identified the data as synthetic.
- Daily brief: the first attempt failed schema validation because the model
  returned more than four insight cards. A single retry succeeded with
  gpt-4o-mini and date 27/10/2026. The failed run remains in the audit log.
- The successful brief cited a simulated 23.3% weekly cancellation rate and a
  35.7% revenue decline versus the prior week. These are dataset scenarios,
  not evidence of an actual business or production outage.
- The schema-overflow case is not fixed by this seed change; tighter provider
  output constraints remain a reliability improvement to consider.

Generated response bodies are not cached by this script. Refresh the admin
dashboard to load the new metrics, then generate a new brief in the UI to
exercise the deployed endpoint. Each generation can incur API usage.
