import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadHelper(env = {}, send = async () => ({ error: null })) {
  const logs = [];
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/lib/email/send-order-notification.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(source, {
    exports, URL, Intl, Date, Set,
    process: { env },
    console: { warn: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    require: (name) => name === "resend" ? { Resend: class { emails = { send }; } } : {},
  });
  return { ...exports, logs };
}

const notification = {
  order: {
    id: "order-1", order_number: "ELARA-TEST", customer_name: "<script>test</script>",
    contact_number: "test-contact", preferred_contact_method: "instagram",
    instagram_username: "@test", estimated_total: 598,
    material_acknowledged_at: "2026-10-02T01:00:00Z",
  },
  submittedAt: "2026-10-02T01:00:00Z",
  items: [{
    savedItem: {
      item_name: "Heart Ring", selected_finish: "Gold", selected_color: "Clear",
      selected_size: "7", quantity: 2, unit_price: 299, line_total: 598,
    },
    materials: ["Non-tarnish / Stainless steel"],
  }],
};

test("email escapes customer HTML and includes saved selections, totals and exact Admin link", () => {
  const { buildOrderNotification } = loadHelper();
  const result = buildOrderNotification(notification, "https://example.com");
  assert.ok(!result.html.includes("<script>"));
  for (const text of ["Finish: Gold", "Color: Clear", "Size: 7", "Qty: 2", "₱598.00", "Material acknowledgment: Confirmed", "https://example.com/admin/orders/order-1"]) {
    assert.ok(result.text.includes(text), text);
  }
  assert.ok(!result.text.includes("Length:"));
  assert.ok(!buildOrderNotification(notification, "invalid").text.includes("View order"));
});

test("missing configuration skips sending and logs only a safe warning", async () => {
  let calls = 0;
  const helper = loadHelper({}, async () => { calls++; });
  await helper.sendOrderNotification(notification);
  assert.equal(calls, 0);
  assert.equal(helper.logs.length, 1);
  assert.ok(!JSON.stringify(helper.logs).includes("test-contact"));
});

test("provider failure and exceptions do not reject; sends use order idempotency", async () => {
  const env = { RESEND_API_KEY: "test-key", ORDER_NOTIFICATION_EMAIL: "admin@example.com", ORDER_NOTIFICATION_FROM_EMAIL: "sender@example.com" };
  let key;
  const helper = loadHelper(env, async (_, options) => {
    key = options.idempotencyKey;
    return { error: { name: "validation_error", message: "sensitive provider details" } };
  });
  await assert.doesNotReject(() => helper.sendOrderNotification(notification));
  assert.equal(key, "order-notification/order-1");
  assert.ok(!JSON.stringify(helper.logs).includes("test-key"));
  assert.ok(!JSON.stringify(helper.logs).includes("sensitive provider details"));
  const throwing = loadHelper(env, async () => { throw new Error("private details"); });
  await assert.doesNotReject(() => throwing.sendOrderNotification(notification));
  assert.equal(throwing.logs.length, 1);
});
