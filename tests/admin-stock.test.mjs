import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync("src/features/admin/catalog/stock.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports, Set });
const { getAdminProductStockTotal: stock } = exports;
const base = {
  stock_quantity: 2, has_variants: false, size_length_behavior: "none",
  is_size_customizable: false, size_options: null,
  product_variants: [], product_size_inventory: [],
};

test("ordinary and custom-length products retain product-level stock", () => {
  assert.equal(stock(base), 2);
  assert.equal(stock({ ...base, size_length_behavior: "custom" }), 2);
});

test("variant totals include inactive physical inventory and ignore stale parent stock", () => {
  const product = { ...base, has_variants: true, stock_quantity: 0,
    product_variants: [
      { id: "a", stock_quantity: 2, is_active: false },
      { id: "b", stock_quantity: 3 }, { id: "c", stock_quantity: 1 },
    ],
  };
  assert.equal(stock(product), 6);
  assert.ok(stock(product) > 3);
  assert.equal(stock({ ...product, product_variants: [] }), 0);
});

test("non-variant sizes use only unassigned size rows, including legacy sizing", () => {
  const product = { ...base, size_length_behavior: "preset", stock_quantity: 99,
    product_size_inventory: [
      ...[2, 3, 1].map((quantity) => ({ variant_id: null, stock_quantity: quantity })),
      { variant_id: "old-variant", stock_quantity: 50 },
    ],
  };
  assert.equal(stock(product), 6);
  assert.equal(stock({ ...product, size_length_behavior: "none", is_size_customizable: true, size_options: ["5"] }), 6);
});

test("variant + size totals never double-count derived variant or nested size stock", () => {
  const product = { ...base, has_variants: true, size_length_behavior: "preset_and_custom",
    product_variants: [
      { id: "a", stock_quantity: 100, is_active: false },
      { id: "b", stock_quantity: 100 }, { id: "c", stock_quantity: 100 },
    ],
    product_size_inventory: [
      { variant_id: "a", stock_quantity: 2 }, { variant_id: "a", stock_quantity: 1 },
      { variant_id: "b", stock_quantity: 3 }, { variant_id: "b", stock_quantity: 0 },
      { variant_id: "c", stock_quantity: 1 }, { variant_id: "c", stock_quantity: 2 },
      { variant_id: null, stock_quantity: 40 },
      { variant_id: "other-product-variant", stock_quantity: 40 },
    ],
  };
  const before = JSON.stringify(product);
  assert.equal(stock(product), 9);
  assert.equal(JSON.stringify(product), before);
  assert.equal(stock({ ...product, product_size_inventory: null }), 0);
});
