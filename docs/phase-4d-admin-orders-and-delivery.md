# Phase 4D Admin Orders and Delivery Refinement

## Admin Dashboard Improvements

The admin dashboard now behaves more like a backend control center. It includes
top quick actions for:

- Add Product
- Add Collection
- View Orders
- View Products
- View Collections

It also includes an order queue by status and catalog management metrics for
products, collections, low stock products, active products, and inactive
products.

## Order Status Workflow

Admin order detail pages now include status controls for:

- New
- Contacted
- Confirmed
- Paid
- Packed
- Delivered
- Cancelled

Internal notes can be saved with the status update. Stock deduction and
restoration are still intentionally deferred to Phase 4E.

## Delivery Method Logic

Checkout now supports only these delivery methods:

- Bacolod Delivery - Grab Express
- Bacolod Delivery - Maxim
- Outside Bacolod Shipping - J&T Express
- Drop-off at agreed store

There is no meet-up option.

## Conditional Checkout Fields

Grab Express and Maxim require:

- Bacolod delivery address or pin location

J&T Express requires:

- Complete shipping address

Drop-off at agreed store requires:

- Agreed store or drop-off location

Facebook and Instagram are optional but still shown. Contact number remains
required.

## Bacolod Messaging

The footer now notes:

```text
Based in Bacolod. Available for local delivery and nationwide shipping.
```

Checkout also explains that local delivery uses Grab Express or Maxim and
outside Bacolod shipping uses J&T Express.

## Migration 006

Run this migration manually in Supabase SQL Editor:

```text
supabase/migrations/006_order_delivery_and_admin_status.sql
```

It adds nullable delivery fields to `orders`:

- `delivery_method`
- `courier_service`
- `dropoff_location`
- `shipping_address`

It also adds checks for supported delivery and courier values. Existing orders
remain valid because the new fields are nullable.

## Manual Test Checklist

- Header is thinner.
- Header nav text is light/soft.
- Bacolod-based messaging appears.
- Checkout with Grab requires Bacolod delivery location.
- Checkout with Maxim requires Bacolod delivery location.
- Checkout with J&T requires complete shipping address.
- Checkout with drop-off requires agreed store/drop-off location.
- No meet-up option appears.
- Submitted order appears in admin with correct delivery method.
- Admin dashboard quick actions are visible.
- Orders can be filtered by status.
- Order status can be changed to Contacted.
- Order status can be changed to Delivered / Accomplished.
