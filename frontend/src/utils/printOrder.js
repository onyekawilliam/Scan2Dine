import { money } from './format';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Opens a plain, printer-friendly slip for the kitchen. Customer-entered text is escaped.
// Returns false when the browser blocked the pop-up so the caller can tell the user.
export function printOrderSlip(order) {
  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) return false;

  const lines = order.items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.quantity)}x</td><td>${escapeHtml(i.item_name)}${
          i.special_instructions ? `<br><small>Note: ${escapeHtml(i.special_instructions)}</small>` : ''
        }</td><td style="text-align:right">${escapeHtml(money(i.subtotal))}</td></tr>`
    )
    .join('');

  win.document.write(`<!doctype html><html><head><title>${escapeHtml(order.order_number)}</title>
    <style>body{font-family:system-ui,sans-serif;padding:16px;font-size:14px}h1{font-size:20px;margin:0 0 4px}td{padding:4px 6px;vertical-align:top}small{color:#555}hr{border:0;border-top:1px dashed #999;margin:10px 0}</style></head><body>
    <h1>${escapeHtml(order.order_number)}</h1>
    <div>${order.customer_name ? `Customer: ${escapeHtml(order.customer_name)}<br>` : ''}Table: ${escapeHtml(order.table_number || 'N/A')}<br>${escapeHtml(new Date(order.createdAt).toLocaleString())}</div>
    ${order.special_instructions ? `<div style="margin-top:8px"><strong>Order note:</strong> ${escapeHtml(order.special_instructions)}</div>` : ''}
    <hr><table width="100%">${lines}</table><hr>
    <div style="text-align:right">Subtotal ${escapeHtml(money(order.subtotal))}<br>Tax ${escapeHtml(money(order.tax))}<br><strong>Total ${escapeHtml(money(order.total))}</strong></div>
    <script>window.onload = function () { window.print(); };</script></body></html>`);
  win.document.close();
  return true;
}
