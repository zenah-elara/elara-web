import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync("src/features/catalog/availability.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports, Set });
const { getSellableProductStock: stock, getSellableVariantStock: variantStock } = exports;
const base = {
  has_variants: false, stock_quantity: 2, product_type: "ring",
  size_length_behavior: "none", is_size_customizable: false, size_options: ["6", "7"],
  product_variants: [], product_size_inventory: [],
};

test("sellable totals exclude inactive variants while retaining sold-out products", () => {
  const product = { ...base, has_variants: true, stock_quantity: 99, product_variants: [
    { id: "a", is_active: true, stock_quantity: 0 },
    { id: "b", is_active: true, stock_quantity: 3 },
    { id: "c", is_active: false, stock_quantity: 40 },
  ] };
  assert.equal(stock(product),3);
  assert.equal(variantStock(product,product.product_variants[0]),0);
  assert.equal(stock({ ...product, product_variants: [] }),0);
});

test("preset-size sellability ignores stale parent/variant totals and retired sizes", () => {
  const product = { ...base, size_length_behavior: "preset", stock_quantity: 99,
    product_size_inventory: [
      { variant_id: null, size_label: "6", stock_quantity: 0 },
      { variant_id: null, size_label: "7", stock_quantity: 2 },
      { variant_id: null, size_label: "old", stock_quantity: 50 },
    ],
  };
  assert.equal(stock(product),2);
  assert.equal(stock({ ...product, product_size_inventory: [] }),0);
  assert.equal(stock({ ...product, size_length_behavior: "none", is_size_customizable: true }),2);
});

test("variant sizes and restocking use exact active variant pools", () => {
  const product = { ...base, has_variants: true, size_length_behavior: "preset_and_custom",
    product_variants: [
      { id: "a", is_active: true, stock_quantity: 99, product_size_inventory: [{ variant_id: "a", size_label: "6", stock_quantity: 0 }] },
      { id: "b", is_active: true, stock_quantity: 99, product_size_inventory: [{ variant_id: "b", size_label: "7", stock_quantity: 3 }] },
      { id: "c", is_active: false, stock_quantity: 99, product_size_inventory: [{ variant_id: "c", size_label: "7", stock_quantity: 50 }] },
    ],
  };
  assert.equal(stock(product),3);
  assert.equal(variantStock(product,product.product_variants[0]),0);
  product.product_variants[0].product_size_inventory[0].stock_quantity = 2;
  assert.equal(variantStock(product,product.product_variants[0]),2);
  assert.equal(stock(product),5);
});

test("builder parts retain product stock behavior", () => {
  assert.equal(stock({ ...base, product_type: "chain", size_length_behavior: "preset" }),2);
});

test("regular catalog queries retain sold-out products while builder queries keep stock filters", async () => {
  const queryExports = {};
  const product = {
    ...base, id: "product-a", name: "Ring", slug: "ring", price: 299,
    stock_quantity: 0, is_active: true, is_published: true,
    collections: { name: "Rings", slug: "rings", is_published: true },
    product_images: [], product_tags: [],
  };
  const client = { from: () => ({
    select() { return this; }, order() { return this; }, eq() { return this; }, in() { return this; },
    then(resolve) { resolve({ data: [product], error: null }); },
  }) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/features/catalog/queries.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports: queryExports, Set, Map, console,
    require: (name) => {
      if (name === "./availability") return exports;
      if (name === "@/lib/data") return { collections: [] };
      if (name === "@/lib/supabase/server") return { getSupabasePublicServerClient: () => client };
      return { normalizeMaterialType: () => null, getMaterialNote: () => null, getMaterialCareInstruction: () => null };
    },
  });
  for (const query of ["getActiveProducts", "getFeaturedProducts", "getNewArrivalProducts", "getReadyToShopProducts"]) {
    assert.equal((await queryExports[query]()).length,1,query);
  }
  assert.equal((await queryExports.getProductsByCollectionSlug("rings")).length,1);
  assert.equal((await queryExports.getProductBySlug("ring")).stock,0);
  assert.equal((await queryExports.getBuilderChains()).length,0);
  product.collections.is_published = false;
  assert.equal((await queryExports.getActiveProducts()).length,0);
});
