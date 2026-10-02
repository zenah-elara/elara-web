import "server-only";

import { Resend } from "resend";
import type { Database } from "@/lib/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Insert"];
type Item = Database["public"]["Tables"]["order_items"]["Insert"];

export type OrderNotification = {
  order: Order & { id: string; order_number: string };
  items: { savedItem: Item; materials: string[]; customDetails?: string[] }[];
  submittedAt: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency", currency: "PHP",
  }).format(value);
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila",
  }).format(new Date(value)) + " (Asia/Manila)";
}

export function buildOrderNotification(notification: OrderNotification, siteUrl?: string) {
  const { order, items, submittedAt } = notification;
  let adminUrl: string | undefined;
  try {
    const base = new URL(siteUrl ?? "");
    if (["https:", "http:"].includes(base.protocol)) {
      adminUrl = new URL(`/admin/orders/${encodeURIComponent(order.id)}`, base).href;
    }
  } catch {
    // The notification is still useful without a configured Admin link.
  }

  const lines = [
    "New elara. order request", `Order: #${order.order_number}`, "", "Customer",
    `Name: ${order.customer_name}`, `Contact number: ${order.contact_number}`,
    order.facebook_link ? `Facebook: ${order.facebook_link}` : "",
    order.instagram_username ? `Instagram: ${order.instagram_username}` : "",
    `Preferred contact: ${order.preferred_contact_method}`,
    `Delivery: ${order.shipping_address || order.dropoff_location || order.delivery_location || "To confirm"}`,
    order.order_notes ? `Notes: ${order.order_notes}` : "",
    "", "Items",
  ].filter((line) => line !== "");

  for (const { savedItem: item, materials, customDetails } of items) {
    lines.push("", item.item_name);
    if (item.selected_finish) lines.push(`Finish: ${item.selected_finish}`);
    if (item.selected_color) lines.push(`Color: ${item.selected_color}`);
    if (item.selected_size) lines.push(`${item.selected_size_label || "Size"}: ${item.selected_size}`);
    if (item.selected_custom_length) lines.push(`${item.selected_custom_length_label || "Length"}: ${item.selected_custom_length}`);
    if (materials.length) lines.push(`Material: ${materials.join("; ")}`);
    if (customDetails) lines.push(...customDetails);
    lines.push(`Qty: ${item.quantity}`, `Unit price: ${peso(Number(item.unit_price))}`, `Line total: ${peso(Number(item.line_total))}`);
  }
  lines.push("", `Order total: ${peso(Number(order.estimated_total))}`);
  if (order.material_acknowledged_at) {
    lines.push("Material acknowledgment: Confirmed", `Confirmed at: ${dateTime(order.material_acknowledged_at)}`);
  }
  lines.push(`Submitted: ${dateTime(submittedAt)}`);
  if (adminUrl) lines.push("", `View order in Admin: ${adminUrl}`);

  const text = lines.join("\n");
  const html = `<html><body style="margin:0;background:#fff;font-family:Arial,sans-serif;color:#513747"><main style="max-width:600px;margin:auto;padding:24px"><h1 style="font-size:22px;color:#7a3f63">New elara. order request</h1><div style="border-top:3px solid #efccd4;padding-top:16px;line-height:1.6">${lines.map((line) => line ? `<div>${escapeHtml(line)}</div>` : "<br>").join("")}</div>${adminUrl ? `<p><a style="color:#7a3f63" href="${escapeHtml(adminUrl)}">View order in Admin</a></p>` : ""}</main></body></html>`;
  return { subject: `New elara. order request — #${order.order_number}`, html, text };
}

export async function sendOrderNotification(notification: OrderNotification): Promise<void> {
  const orderId = notification.order.id;
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ORDER_NOTIFICATION_EMAIL;
    const from = process.env.ORDER_NOTIFICATION_FROM_EMAIL;
    if (!apiKey || !to || !from) {
      console.warn("Order notification email skipped because email configuration is missing.", { orderId });
      return;
    }

    const resend = new Resend(apiKey);
    const email = buildOrderNotification(notification, process.env.NEXT_PUBLIC_SITE_URL);
    const { error } = await resend.emails.send({ from, to, ...email }, {
      idempotencyKey: `order-notification/${orderId}`,
    });
    if (error) {
      console.error("Order created successfully, but Admin notification email failed.", {
        orderId, reason: error.name,
      });
    }
  } catch {
    console.error("Order created successfully, but Admin notification email failed.", {
      orderId, reason: "notification_exception",
    });
  }
}
