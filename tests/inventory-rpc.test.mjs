import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const runtime = process.env.ELARA_SQL_TEST_RUNTIME;
const require = createRequire(import.meta.url);
const uid = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;

test("exact-source inventory RPC on isolated PostgreSQL", { skip: !runtime }, async (t) => {
  const { PGlite } = require(runtime);
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql as 'select ''${uid(999)}''::uuid';
      create table admin_profiles(user_id uuid,is_active boolean,role text);
      insert into admin_profiles values('${uid(999)}',true,'owner');
      create table products(id uuid primary key,stock_quantity integer not null check(stock_quantity>=0),
        has_variants boolean default false,is_active boolean default true,
        size_length_behavior text default 'none',is_size_customizable boolean default false,size_options text[]);
      create table product_variants(id uuid primary key,product_id uuid references products,
        stock_quantity integer not null check(stock_quantity>=0),is_active boolean default true);
      create table product_size_inventory(id uuid primary key,product_id uuid references products,
        variant_id uuid references product_variants,size_label text,stock_quantity integer not null check(stock_quantity>=0));
      create table orders(id uuid primary key,status text default 'new',internal_notes text,
        confirmed_at timestamptz,stock_deducted_at timestamptz,cancelled_at timestamptz);
      create table order_items(id uuid primary key,order_id uuid references orders,product_id uuid references products,
        variant_id uuid references product_variants,item_type text default 'regular_product',quantity integer,selected_size text);
      create table custom_necklace_items(id uuid primary key,order_item_id uuid references order_items,chain_product_id uuid references products);
      create table custom_necklace_charms(id uuid primary key,custom_necklace_item_id uuid references custom_necklace_items,
        charm_product_id uuid references products,quantity integer);
      create table inventory_movements(id uuid primary key default gen_random_uuid(),product_id uuid references products,
        variant_id uuid references product_variants on delete set null,size_inventory_id uuid references product_size_inventory on delete set null,
        order_id uuid references orders,movement_type text,quantity_change integer,previous_stock integer,new_stock integer,reason text);
    `);
    await db.exec(fs.readFileSync("supabase/migrations/024_fix_variant_inventory_and_out_of_stock.sql", "utf8"));

    async function reset() {
      await db.exec("truncate inventory_movements,custom_necklace_charms,custom_necklace_items,order_items,orders,product_size_inventory,product_variants,products;");
      await db.query("insert into orders(id) values ($1)", [uid(100)]);
    }
    async function product(id, stock, variants = false, behavior = "none") {
      await db.query("insert into products(id,stock_quantity,has_variants,size_length_behavior,size_options) values($1,$2,$3,$4,ARRAY['6','7'])", [uid(id),stock,variants,behavior]);
    }
    async function variant(id, productId, stock) {
      await db.query("insert into product_variants(id,product_id,stock_quantity) values($1,$2,$3)", [uid(id),uid(productId),stock]);
    }
    async function size(id, productId, variantId, label, stock) {
      await db.query("insert into product_size_inventory values($1,$2,$3,$4,$5)", [uid(id),uid(productId),variantId ? uid(variantId) : null,label,stock]);
    }
    async function item(id, productId, variantId, quantity, selectedSize = null) {
      await db.query("insert into order_items(id,order_id,product_id,variant_id,quantity,selected_size) values($1,$2,$3,$4,$5,$6)", [uid(id),uid(100),uid(productId),variantId ? uid(variantId) : null,quantity,selectedSize]);
    }
    async function status(next) {
      return (await db.query("select * from update_order_status_inventory($1,$2)", [uid(100),next])).rows[0];
    }
    async function stock(table, id) {
      return (await db.query(`select stock_quantity from ${table} where id=$1`, [uid(id)])).rows[0].stock_quantity;
    }

    await t.test("variant-only deduction, repeat confirmation, quantity and exact restoration", async () => {
      await reset(); await product(1,0,true); await variant(11,1,5); await variant(12,1,3);
      await item(101,1,11,2);
      assert.equal((await status("confirmed")).success,true);
      assert.equal(await stock("product_variants",11),3);
      assert.equal(await stock("product_variants",12),3);
      assert.equal(await stock("products",1),0);
      await status("confirmed");
      assert.equal(await stock("product_variants",11),3);
      assert.equal((await status("cancelled")).success,true);
      assert.equal(await stock("product_variants",11),5);
      await status("cancelled");
      assert.equal(await stock("product_variants",11),5);
      const movements = (await db.query("select variant_id,quantity_change from inventory_movements order by quantity_change")).rows;
      assert.deepEqual(movements.map((row) => row.quantity_change),[-2,2]);
      assert.ok(movements.every((row) => row.variant_id === uid(11)));
    });

    await t.test("variant + size deducts only selected row and restores its stable ID", async () => {
      await reset(); await product(1,99,true,"preset"); await variant(11,1,99); await variant(12,1,99);
      await size(21,1,11,"6",2); await size(22,1,11,"7",3); await size(23,1,12,"7",4);
      await item(101,1,11,2,"7");
      assert.equal((await status("confirmed")).success,true);
      assert.equal(await stock("product_size_inventory",22),1);
      assert.equal(await stock("product_size_inventory",21),2);
      assert.equal(await stock("product_size_inventory",23),4);
      assert.equal(await stock("product_variants",11),99);
      assert.equal(await stock("products",1),99);
      await db.query("update product_size_inventory set size_label='renamed' where id=$1",[uid(22)]);
      assert.equal((await status("cancelled")).success,true);
      assert.equal(await stock("product_size_inventory",22),3);
      const movements = (await db.query("select * from inventory_movements")).rows;
      assert.ok(movements.every((row) => row.size_inventory_id === uid(22) && row.variant_id === uid(11)));
    });

    await t.test("product and non-variant size pools are independent", async () => {
      await reset(); await product(1,5); await product(2,99,false,"preset");
      await size(21,2,null,"6",4); await size(22,2,null,"7",3);
      await item(101,1,null,2); await item(102,2,null,2,"7");
      assert.equal((await status("confirmed")).success,true);
      assert.equal(await stock("products",1),3);
      assert.equal(await stock("products",2),99);
      assert.equal(await stock("product_size_inventory",22),1);
      assert.equal(await stock("product_size_inventory",21),4);
      await status("cancelled");
      assert.equal(await stock("products",1),5);
      assert.equal(await stock("product_size_inventory",22),3);
    });

    await t.test("insufficient total quantity rolls back the whole order", async () => {
      await reset(); await product(1,5); await product(2,0,true); await variant(11,2,3);
      await item(101,1,null,1); await item(102,2,11,2); await item(103,2,11,2);
      assert.equal((await status("confirmed")).success,false);
      assert.equal(await stock("products",1),5);
      assert.equal(await stock("product_variants",11),3);
      assert.equal((await db.query("select count(*)::int count from inventory_movements")).rows[0].count,0);
      assert.equal((await db.query("select status from orders")).rows[0].status,"new");
    });

    await t.test("missing size or variant cannot fall back to generic inventory", async () => {
      await reset(); await product(1,99,true,"preset"); await variant(11,1,99); await item(101,1,11,1,"7");
      assert.equal((await status("confirmed")).success,false);
      assert.equal(await stock("product_variants",11),99);
      await db.query("update order_items set variant_id=null");
      assert.equal((await status("confirmed")).success,false);
      assert.equal(await stock("products",1),99);
    });

    await t.test("deleted size row never restores to its surviving variant", async () => {
      await reset(); await product(1,99,true,"preset"); await variant(11,1,99); await size(21,1,11,"7",3);
      await item(101,1,11,1,"7"); await status("confirmed");
      await db.query("delete from product_size_inventory");
      assert.equal((await status("cancelled")).success,false);
      assert.equal(await stock("product_variants",11),99);
      assert.equal((await db.query("select status from orders")).rows[0].status,"confirmed");
    });

    await t.test("movement write failure rolls back stock mutations already executed", async () => {
      await reset(); await product(1,5); await item(101,1,null,2);
      await db.exec("alter table inventory_movements add constraint test_movement_failure check(quantity_change > 0)");
      assert.equal((await status("confirmed")).success,false);
      assert.equal(await stock("products",1),5);
      assert.equal((await db.query("select status from orders")).rows[0].status,"new");
      await db.exec("alter table inventory_movements drop constraint test_movement_failure");
    });

    await t.test("builder chain and add-ons retain product-pool deduction and restoration", async () => {
      await reset(); await product(1,4); await product(2,5);
      await db.query("insert into order_items(id,order_id,item_type,quantity) values($1,$2,'custom_necklace',1)",[uid(101),uid(100)]);
      await db.query("insert into custom_necklace_items values($1,$2,$3)",[uid(201),uid(101),uid(1)]);
      await db.query("insert into custom_necklace_charms values($1,$2,$3,2)",[uid(301),uid(201),uid(2)]);
      assert.equal((await status("confirmed")).success,true);
      assert.equal(await stock("products",1),3);
      assert.equal(await stock("products",2),3);
      await status("cancelled");
      assert.equal(await stock("products",1),4);
      assert.equal(await stock("products",2),5);
    });
  } finally {
    await db.close();
  }
});
