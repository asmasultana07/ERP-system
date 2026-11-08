"use client";

export default function InvoicePrintView({ sale }) {
  if (!sale) return null;

  const isCancelled = sale.status === "Cancelled";

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  const invoiceDate = new Date(sale.saleDate || sale.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const customer = sale.customer;
  const customerName = sale.customerName || (customer?.name) || "Walk-in Customer";

  function handlePrint() {
    const html = buildInvoiceHTML({ sale, isCancelled, fmt, invoiceDate, customerName, customer });
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    // Small delay so styles load before print dialog
    setTimeout(() => {
      win.print();
    }, 400);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 rounded-xl border border-vendora/20 bg-vendora-bg px-3.5 py-2 text-xs font-semibold text-vendora transition hover:bg-vendora hover:text-white"
    >
      <PrinterIcon />
      <span>Print Invoice</span>
    </button>
  );
}

function PrinterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}

function buildInvoiceHTML({ sale, isCancelled, fmt, invoiceDate, customerName, customer }) {
  const itemRows = (sale.items || [])
    .map(
      (it, i) => `
      <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="td-product">
          <span class="product-name">${escHtml(it.product?.name || "Product")}</span>
        </td>
        <td class="td-sku">${escHtml(it.product?.sku || "—")}</td>
        <td class="td-center">${Number(it.quantity)} ${escHtml(it.product?.unit || "pcs")}</td>
        <td class="td-right">${fmt(it.unitPrice)}</td>
        <td class="td-right td-bold">${fmt(it.subtotal)}</td>
      </tr>`
    )
    .join("");

  const customerBlock = `
    <p class="cust-name">${escHtml(customerName)}</p>
    ${customer ? `<p class="cust-type">Registered Account</p>` : `<p class="cust-type">Walk-in Buyer</p>`}
    ${customer?.phone ? `<p class="cust-detail">Phone: ${escHtml(customer.phone)}</p>` : ""}
    ${customer?.email ? `<p class="cust-detail">Email: ${escHtml(customer.email)}</p>` : ""}
    ${customer?.address ? `<p class="cust-detail">Address: ${escHtml(customer.address)}</p>` : ""}
  `;

  const payBadgeClass =
    sale.paymentStatus === "Paid"
      ? "badge-paid"
      : sale.paymentStatus === "Partial"
      ? "badge-partial"
      : "badge-unpaid";

  const cancelledBanner = isCancelled
    ? `<div class="cancelled-banner">CANCELLED</div>`
    : "";

  const notesBlock =
    sale.notes
      ? `<div class="notes-box">
           <p class="notes-label">Notes</p>
           <p class="notes-text">${escHtml(sale.notes)}</p>
         </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice ${escHtml(sale.invoiceNumber)} – VENDORA</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    color: #1f2937;
    background: #f0fdf4;
    padding: 24px;
  }

  .page {
    max-width: 794px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 32px rgba(6,78,59,0.10);
  }

  /* ── Header ── */
  .header {
    background: #064e3b;
    color: #fff;
    padding: 32px 40px 28px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }
  .brand-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #fff;
  }
  .brand-tagline {
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.60);
    margin-top: 4px;
  }
  .invoice-meta { text-align: right; }
  .invoice-label {
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
  }
  .invoice-number {
    font-size: 20px;
    font-weight: 700;
    font-family: "Courier New", monospace;
    color: #6ee7b7;
    margin-top: 4px;
  }
  .invoice-date {
    font-size: 12px;
    color: rgba(255,255,255,0.70);
    margin-top: 6px;
  }

  /* ── Cancelled banner ── */
  .cancelled-banner {
    background: #fef2f2;
    border-top: 3px solid #ef4444;
    border-bottom: 3px solid #ef4444;
    color: #b91c1c;
    text-align: center;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 6px;
    padding: 10px;
  }

  /* ── Body ── */
  .body { padding: 32px 40px; }

  /* ── Customer ── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #064e3b;
    margin-bottom: 8px;
  }
  .customer-box {
    background: #f0fdf4;
    border: 1px solid #d1fae5;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 28px;
  }
  .cust-name { font-size: 15px; font-weight: 700; color: #022c22; }
  .cust-type {
    display: inline-block;
    margin-top: 4px;
    font-size: 10px;
    font-weight: 600;
    background: #d1fae5;
    color: #065f46;
    padding: 2px 8px;
    border-radius: 99px;
  }
  .cust-detail { font-size: 12px; color: #4b5563; margin-top: 3px; }

  /* ── Items table ── */
  .items-section { margin-bottom: 28px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr {
    background: #064e3b;
    color: #fff;
  }
  thead th {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .th-left { text-align: left; }
  .th-center { text-align: center; }
  .th-right { text-align: right; }
  .row-even { background: #fff; }
  .row-odd  { background: #f9fafb; }
  td { padding: 11px 14px; vertical-align: top; }
  .td-product { max-width: 220px; }
  .product-name { font-weight: 600; color: #111827; word-break: break-word; }
  .td-sku { font-family: "Courier New", monospace; font-size: 11px; color: #064e3b; white-space: nowrap; }
  .td-center { text-align: center; color: #374151; }
  .td-right { text-align: right; color: #374151; }
  .td-bold { font-weight: 700; color: #022c22; }
  tbody tr:last-child td { border-bottom: 2px solid #064e3b; }

  /* ── Totals + Notes ── */
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .notes-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px 18px;
  }
  .notes-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 6px;
  }
  .notes-text { font-size: 12px; color: #374151; white-space: pre-wrap; line-height: 1.6; }

  .totals-box {
    background: #f0fdf4;
    border: 1px solid #d1fae5;
    border-radius: 8px;
    padding: 14px 18px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    font-size: 13px;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }
  .totals-row:last-child { border-bottom: none; }
  .totals-row.grand {
    font-size: 15px;
    font-weight: 800;
    color: #022c22;
    border-top: 2px solid #064e3b;
    border-bottom: none;
    padding-top: 10px;
    margin-top: 4px;
  }
  .totals-row.paid-row { color: #065f46; font-weight: 600; }
  .totals-row.due-row  { color: #92400e; font-weight: 600; }
  .totals-val { font-weight: 600; }

  /* ── Payment status badge ── */
  .badge-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .badge-paid    { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .badge-partial { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .badge-unpaid  { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

  /* ── Footer ── */
  .footer {
    background: #064e3b;
    color: rgba(255,255,255,0.75);
    text-align: center;
    padding: 16px 40px;
    font-size: 12px;
    letter-spacing: 0.5px;
  }
  .footer strong { color: #fff; }

  /* ── Print button (screen only) ── */
  .print-btn-bar {
    max-width: 794px;
    margin: 0 auto 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .print-btn {
    background: #064e3b;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 9px 22px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.3px;
  }
  .print-btn:hover { background: #022c22; }

  /* ── A4 print ── */
  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; max-width: 100%; }
    .print-btn-bar { display: none; }
    @page { size: A4; margin: 12mm 14mm; }
  }
</style>
</head>
<body>

<div class="print-btn-bar">
  <button class="print-btn" onclick="window.print()">⎙ Save as PDF / Print</button>
</div>

<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-name">VENDORA</div>
      <div class="brand-tagline">Wholesale &amp; Distribution Management</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-label">Invoice</div>
      <div class="invoice-number">${escHtml(sale.invoiceNumber)}</div>
      <div class="invoice-date">${escHtml(invoiceDate)}</div>
    </div>
  </div>

  ${cancelledBanner}

  <!-- Body -->
  <div class="body">

    <!-- Customer -->
    <div class="section-label">Bill To</div>
    <div class="customer-box">
      ${customerBlock}
    </div>

    <!-- Items -->
    <div class="items-section">
      <div class="section-label">Items</div>
      <table>
        <thead>
          <tr>
            <th class="th-left">Product</th>
            <th class="th-left">SKU</th>
            <th class="th-center">Qty</th>
            <th class="th-right">Unit Price</th>
            <th class="th-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Notes + Totals -->
    <div class="bottom-grid">
      ${notesBlock || `<div></div>`}
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span class="totals-val">${fmt(sale.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Discount</span>
          <span class="totals-val">-${fmt(sale.discount)}</span>
        </div>
        <div class="totals-row grand">
          <span>Grand Total</span>
          <span>${fmt(sale.totalAmount)}</span>
        </div>
        <div class="totals-row paid-row">
          <span>Paid Amount</span>
          <span class="totals-val">${fmt(sale.paidAmount)}</span>
        </div>
        <div class="totals-row due-row">
          <span>Balance Due</span>
          <span class="totals-val">${fmt(sale.dueAmount)}</span>
        </div>
        <div class="badge-row">
          <span class="badge ${payBadgeClass}">${escHtml(sale.paymentStatus)}</span>
        </div>
      </div>
    </div>

  </div><!-- /body -->

  <!-- Footer -->
  <div class="footer">
    <strong>Thank you for your business!</strong> &nbsp;·&nbsp; VENDORA Wholesale &amp; Distribution
  </div>

</div><!-- /page -->
</body>
</html>`;
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
