# Admin order notifications

New order requests trigger a server-side Resend notification only after the
order, order items, and any custom-piece detail rows have been inserted.
The email uses the successful insert payloads, with regular prices and materials
resolved from the product/variant records and builder totals from the existing
pricing helper. It does not require public SELECT access to private orders.

## Configuration

In Vercel > Project > Settings > Environment Variables, add:

- `RESEND_API_KEY`: a Resend sending API key.
- `ORDER_NOTIFICATION_EMAIL`: the Admin inbox receiving alerts.
- `ORDER_NOTIFICATION_FROM_EMAIL`: a sender on your verified Resend domain.
- `NEXT_PUBLIC_SITE_URL` (optional): the canonical site origin for Admin links.

The first three variables must remain server-only. Do not prefix them with
`NEXT_PUBLIC_`, commit credentials, or paste them in logs. Redeploy after adding
environment variables. No SQL or migration is needed.

Create/verify a sending domain in Resend and add its required DNS records. Use a
sender on that domain. Without a valid site URL, the notification omits the Admin
link. No customer email address is currently collected by checkout.

## Delivery and retries

Missing configuration or provider errors are logged with the order ID and a safe
reason, without customer contact information or API keys. A saved order remains
successful even if notification delivery fails. No automatic retry queue or
delivery-status database record is added in this phase.

Each email uses `order-notification/<orderId>` as its Resend idempotency key.
Resend deduplicates repeated sends with that key within its idempotency window.
The trigger runs only in the new-order submission action, never on page render,
refresh, or Admin updates. Existing checkout pending protection is preserved.
This does not add database-level idempotency for separate checkout submissions:
the current action assigns a new order ID to each successful creation.

## Manual validation after configuration

1. Submit a regular order and confirm one email and a normal checkout success.
2. Check Finish/Color, size, custom length, inherited/overridden material, saved
   quantities/prices, total, and material acknowledgment.
3. Submit a builder order and check chain, add-ons, length, materials, and total.
4. Confirm the Admin link opens the exact order behind normal Admin protection.
5. Test missing/invalid email configuration in a test deployment: the order must
   remain successful and notification failure must appear only in server logs.

Live mail is not sent during local automated validation.
