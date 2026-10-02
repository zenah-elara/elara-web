import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { randomUUID } from "node:crypto";

function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,"utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, FormData, Map, Set, Date, Math, JSON,
    process: { env: { NODE_ENV: "production" } },
    console,
    require: (name) => imports[name] ?? {},
  });
  return exports;
}

const availability = load("src/features/catalog/availability.ts");
const product = {
  id: "product-a", name: "Ring", price: 299, is_active: true,
  has_variants: true, stock_quantity: 0, finish_type: "gold_plated",
  size_length_behavior: "preset", is_size_customizable: true, size_options: ["7"],
};
const variant = {
  id: "variant-a", product_id: product.id, stock_quantity: 0,
  finish: "Gold", color: "Clear", price_override: null,
  material_type_override: null, is_active: true,
};
const item = {
  itemType: "regular_product", productId: product.id, variantId: variant.id,
  name: "Ring", unitPrice: 1, quantity: 2, selectedSize: "7", sizeLabel: "Ring size",
};

async function checkout(items, rows) {
  const writes = [];
  const client = { from: (table) => ({
    select() { return this; }, in() { return this; },
    then(resolve) { resolve({ data: rows[table] ?? [], error: null }); },
    async insert(payload) { writes.push({ table, payload }); return { error: null }; },
  }) };
  const { submitOrderRequest } = load("src/features/orders/actions.ts", {
    crypto: { randomUUID },
    "@/lib/supabase/server": { getSupabasePublicServerClient: () => client },
    "@/lib/email/send-order-notification": { sendOrderNotification: async () => {} },
    "@/lib/materials": { getMaterialLabel: () => "Gold-plated" },
    "@/features/catalog/availability": availability,
  });
  const data = new FormData();
  for (const [key, value] of Object.entries({
    customer_name: "Test", contact_number: "test", delivery_location: "test",
    delivery_option: "grab_express", preferred_contact_method: "instagram",
    material_acknowledged: "true", cart_json: JSON.stringify({ items }),
  })) data.set(key,value);
  return { result: await submitOrderRequest(data), writes };
}

test("checkout trusts exact size stock and saves variant + chosen size identifiers", async () => {
  const { result, writes } = await checkout([item], {
    products: [product], product_variants: [variant],
    product_size_inventory: [{ id: "size-a", product_id: product.id, variant_id: variant.id, size_label: "7", stock_quantity: 2 }],
  });
  assert.equal(result.success,true);
  const saved = writes.find((write) => write.table === "order_items").payload[0];
  assert.equal(saved.variant_id,variant.id);
  assert.equal(saved.selected_size,"7");
  assert.equal(saved.selected_size_label,"Ring size");
  assert.equal(saved.quantity,2);
  assert.equal(saved.unit_price,299);
});

test("repeated cart lines cannot exceed the exact size bucket", async () => {
  const { result, writes } = await checkout([item,{ ...item, customLength: "different" }], {
    products: [product], product_variants: [variant],
    product_size_inventory: [{ id: "size-a", product_id: product.id, variant_id: variant.id, size_label: "7", stock_quantity: 3 }],
  });
  assert.equal(result.success,false);
  assert.equal(writes.length,0);
});

test("live zero-stock variant and inactive variants block checkout before inserts", async () => {
  const noSizes = { ...product, size_length_behavior: "none", is_size_customizable: false, size_options: null };
  for (const option of [variant,{ ...variant, stock_quantity: 4, is_active: false }]) {
    const { result, writes } = await checkout([{ ...item, selectedSize: null }], {
      products: [noSizes], product_variants: [option],
    });
    assert.equal(result.success,false);
    assert.equal(writes.length,0);
  }
});

test("non-variant size products never consult stale parent totals", async () => {
  const { result } = await checkout([{ ...item, variantId: null }], {
    products: [{ ...product, has_variants: false }],
    product_size_inventory: [{ id: "size-a", product_id: product.id, variant_id: null, size_label: "7", stock_quantity: 2 }],
  });
  assert.equal(result.success,true);
});
