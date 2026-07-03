# Phase 4F Build Your Elara Piece

Phase 4F turns Build Your Elara Piece into a working V1 builder while keeping
checkout as an order request flow. No payment is collected on the site.

Do not use `Charm Bar` as the customer-facing builder name. The visible name is
`Build Your Elara Piece`, while the route can remain `/build-your-necklace`.

## Builder User Flow

Customers can:

1. Choose one active chain product.
2. Choose a chain length: `16 inches`, `18 inches`, `20 inches`, or
   `Custom / to confirm`.
3. Optionally choose one connector.
4. Add any mix of main charms, mini charms, and pendants.
5. Arrange selected charms, minis, and pendants in the exact order they want.
6. Review the chain, length, connector, selected items, price breakdown, and total.
7. Add the custom necklace to cart as one fixed-quantity item.

The builder does not force one formula. Customers can choose different
combinations as long as stock is available.

## Connector Logic

Connectors are separate holder/add-on products. They are not part of the
movable arrangement row.

Customers can choose no connector or one connector. If they choose another
connector, it replaces the previous connector.

When a connector is selected, charms, pendants, and mini charms are labeled as
`Inside connector`. Without a connector, they are labeled as `Arrangement`.

For V1, connector data is stored in `custom_necklace_charms` with
`product_type = connector` and `arrangement_order = -1`. This keeps connector
logic separate in the app while preserving the existing stock workflow.

## Cart Behavior

Custom necklaces are stored in cart as one item:

- Item name: `Custom Necklace`
- Quantity: fixed at `1`
- Chain and chain length shown
- Connector shown separately when selected
- Selected items shown in arrangement order
- Total equals chain price plus connector price plus selected item prices

Regular product cart behavior remains unchanged.

## Checkout Behavior

Regular products continue to create normal `order_items` rows.

Custom necklaces create:

- One `order_items` row with `item_type = custom_necklace`
- One `custom_necklace_items` row with chain details and chain length
- One connector row in `custom_necklace_charms`, if selected
- One or more selected charm/pendant/mini charm rows in `custom_necklace_charms`

Checkout checks product availability but does not deduct stock.

Migration `010_fix_order_item_and_custom_necklace_saving.sql` repairs checkout
insert policies so order item and custom necklace detail rows save reliably.

Successful checkout redirects to
`/checkout/success?orderNumber=ORDER_NUMBER`.

The customer sees:

- `Your order request has been submitted.`
- `Order number: [order number]`
- Confirmation that elara. will contact them through their selected contact
  method to confirm availability, payment, and delivery.

## Stock Deduction and Restoration

Stock still deducts only when admin marks an order `Confirmed`.

The existing Phase 4E workflow deducts and restores:

- One selected chain
- Connector, if selected
- Each selected charm, mini charm, or pendant quantity

The workflow prevents double deduction/restoration and checks for insufficient
stock before confirmation.

## Admin Order Display

Admin order detail includes a visual `Items ordered` preview for both normal
product orders and custom Build Your Elara Piece orders.

Regular product orders show:

- Product thumbnail or branded placeholder
- Product name
- Quantity
- Unit price
- Line total
- Product type when available

Custom necklace orders show:

- Chain thumbnail/name
- Chain length
- Connector thumbnail/name, if selected
- `Inside connector` when connector is selected
- `Arrangement` when no connector is selected
- Selected charms, pendants, and mini charms in customer arrangement order
- Quantity and price for each selected item
- Custom necklace total

Admin stock impact preview expands custom necklaces into the actual products
that will be affected when the order is confirmed.

If an existing test order has no saved item rows, admin shows a clear incomplete
order warning.

## Admin Create Redirects

After product creation, admin redirects to `/admin/products` with
`Product saved.` and an `Add New Product` button.

After collection creation, admin redirects to `/admin/collections` with
`Collection saved.` and an `Add New Collection` button.

Admin no longer lands on an edit form after creating a product or collection.

## Homepage Brand Promise

The homepage brand promise uses the 2020 to 2026 return story:

- Since 2020, elara. has stood by quality jewelry at accessible prices.
- The brand started after seeing how hard it was for women in Negros to find
  cute, affordable pieces that still felt worth wearing.
- elara. later shipped to women in different parts of the Philippines.
- Returning in 2026, the same promise continues with more intention.

The homepage no longer uses `honest details` as a section title, card title,
pill, or highlight.

## Builder Empty State

The public builder needs active products before it can be used.

If chains or builder items are missing, the page shows:

`Add chain, charm, pendant, mini charm, or connector products in Admin to start using the builder.`

The Add to Cart button is disabled until the customer chooses one chain and at
least one charm, pendant, or mini charm.

## Migration

Run this migration manually in Supabase SQL Editor after migrations 001-007:

`supabase/migrations/008_builder_product_types_and_arrangement.sql`

It adds:

- `mini_charm` and `connector` product types
- `chain_length`
- `product_type` and `arrangement_order` for custom necklace selected items
- Public insert policies for checkout custom necklace detail rows

Do not commit `.env.local`. Do not add service role keys to the frontend.

## Manual Test Checklist

1. Admin creates chain product.
2. Admin creates pendant/main charm product.
3. Admin creates mini charm product.
4. Admin creates connector product if used.
5. If no builder products are active, Build Your Elara Piece shows the setup
   message and Add to Cart stays disabled.
6. Customer opens Build Your Elara Piece.
7. Customer chooses chain and length.
8. Customer selects or skips connector.
9. Customer selects multiple charms/minis/pendants.
10. Customer arranges selected items.
11. Preview follows arrangement and labels items as Inside connector when needed.
12. Customer adds custom necklace to cart.
13. Cart shows chain, length, connector, selected items, order, and total.
14. Checkout submits order.
15. Checkout success page shows the saved order number.
16. Admin order detail shows exact visual order preview.
17. Admin stock preview shows chain, connector, and every selected item.
18. Confirming order deducts chain, connector, and selected items.
19. Cancelling confirmed order restores chain, connector, and selected items.
20. Product creation returns to the product list with `Product saved.`
21. Collection creation returns to the collection list with `Collection saved.`

## V1 Limitations

- No visual drag-and-drop arrangement yet; customers use Move left / Move right.
- Custom necklaces remain fixed quantity `1` in the cart.
- Storage object cleanup for deleted product images is still a later hardening
  task.
- Checkout is still an order request flow. Payment is not collected on the site.
