/**
 * The purchase invoice, as the customer dashboard has always printed it, shared so the admin
 * partner page produces the same document. It opens as a page in a new window and the
 * print dialog saves it as PDF.
 *
 * Bill To is the partner record (address, email, mobile) and Payment is the gateway payment
 * the purchase was made with (method, TrnX number, TrnX time), or CUSTOM where there was none,
 * both from /package/invoice-details.
 *
 * Every value from the record is escaped. The invoice window shares the portal's origin, so
 * a customer name carrying markup would otherwise run as script in whoever opens the
 * invoice, an administrator included.
 */

export interface InvoicePurchase {
  id?: number | null;
  packageName?: string | null;
  partnerName?: string | null;
  purchaseDate?: string | null;
  expireDate?: string | null;
  price?: number | null;
  vat?: number | null;
  ait?: number | null;
}

export interface InvoiceOptions {
  /** Prepaid accounts have no due date; postpaid ones are due on the 1st of next month. */
  isPrepaid: boolean;
  /** Used when the purchase record carries no customer name. */
  billTo?: string | null;
}

/** What the backend's /package/invoice-details answers: who is billed and how it was paid. */
export interface InvoiceDetails {
  billTo?: {
    idPartner?: number | null;
    name?: string | null;
    address?: string | null;
    email?: string | null;
    mobile?: string | null;
  } | null;
  payment?: {
    /** false: the payment could not be read. Not the same as CUSTOM, and not shown as it. */
    available?: boolean;
    /** No gateway payment: made by BTCL, approved postpaid, or a deployment without a gateway. */
    custom?: boolean;
    method?: string | null;
    transactionId?: string | null;
    bankTransactionId?: string | null;
    /** Bangladesh time, as "2026-10-11T17:37:57". */
    time?: string | null;
  } | null;
  /**
   * Price and VAT as checkout charged them (250 + 38 = 288). Purchases used to be recorded as
   * total / 1.15 (250.43 + 37.57); these print the old ones cleanly. Absent: the purchase row.
   */
  amounts?: { price?: number | null; vat?: number | null; total?: number | null } | null;
  /**
   * The service period this payment bought, in Bangladesh time. A renewal moves the plan's own
   * expiry forward, so the first purchase's row no longer says when its month ended.
   */
  period?: { start?: string | null; end?: string | null } | null;
}

const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Postpaid invoices fall due on the 1st of the month after the purchase. */
export function invoiceDueDate(purchaseDate: string | null | undefined, isPrepaid: boolean): Date | null {
  if (isPrepaid) return null;
  const date = purchaseDate ? new Date(purchaseDate) : new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/** "2026-10-11T17:37:57" as "11 Oct 2026, 05:37 PM (BST)": read as written, never shifted to the viewer's zone. */
export function formatBst(value: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value ?? '');
  if (!m) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hour = Number(m[4]);
  const h12 = String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, '0');
  return `${m[3]} ${months[Number(m[2]) - 1]} ${m[1]}, ${h12}:${m[5]} ${hour < 12 ? 'AM' : 'PM'} (BST)`;
}

/** The Bill To and Payment blocks. Missing details read "—"; nothing is invented. */
function partiesHtml(
  purchase: InvoicePurchase & { idPartner?: number | null },
  partnerName: string,
  details: InvoiceDetails | null | undefined
): string {
  const bill = details?.billTo ?? null;
  const pay = details?.payment ?? null;
  const dash = '—';
  const row = (label: string, value: string, mono = false) =>
    `<tr><td>${esc(label)}</td><td${mono ? ' class="mono"' : ''}>${value}</td></tr>`;
  const text = (value: unknown) => (value === null || value === undefined || String(value).trim() === '' ? dash : esc(value));

  const customerId = bill?.idPartner ?? purchase.idPartner ?? null;
  const billTo = `
    <div class="bill-to">
      <h3>Bill To</h3>
      <p><strong>${esc(bill?.name || partnerName)}</strong></p>
      <table class="kv">
        ${row('Customer ID', text(customerId))}
        ${row('Address', text(bill?.address))}
        ${row('Email', text(bill?.email))}
        ${row('Mobile', text(bill?.mobile))}
      </table>
    </div>`;

  let payment: string;
  if (!pay || pay.available === false) {
    payment = `<p class="muted-note">Payment details are not available for this invoice just now.</p>`;
  } else if (pay.custom) {
    payment = `
      <table class="kv">
        ${row('Payment Method', '<span class="tag-custom">CUSTOM</span>')}
        ${row('TrnX Number', dash, true)}
        ${row('TrnX Time', esc(formatBst(pay.time ?? purchase.purchaseDate)))}
        ${row('Payment Status', 'Recorded by BTCL')}
      </table>`;
  } else {
    payment = `
      <table class="kv">
        ${row('Payment Method', text(pay.method))}
        ${row('TrnX Number', text(pay.transactionId), true)}
        ${pay.bankTransactionId ? row('Bank TrnX ID', esc(pay.bankTransactionId), true) : ''}
        ${row('TrnX Time', esc(formatBst(pay.time)))}
        ${row('Payment Status', '<span class="tag-paid">PAID</span>')}
      </table>`;
  }
  return `
    <div class="bill-grid">
      ${billTo}
      <div class="bill-to">
        <h3>Payment</h3>
        ${payment}
      </div>
    </div>`;
}

export function buildInvoiceHtml(
  purchase: InvoicePurchase & { idPartner?: number | null },
  options: InvoiceOptions,
  origin: string,
  details?: InvoiceDetails | null
): string {
  const { isPrepaid } = options;
  const paymentType = isPrepaid ? 'Prepaid' : 'Postpaid';
  const invoiceId = `INV-${purchase.id || '00000'}`;
  const pkgName = purchase.packageName || 'Package';
  const partnerName = purchase.partnerName || options.billTo || 'Customer';
  const purchaseDate = purchase.purchaseDate ?? null;
  // The package's state comes from its own expiry; the dates printed are this payment's period.
  const packageExpiry = purchase.expireDate ?? null;
  const expireDate = details?.period?.end ?? packageExpiry;
  const periodStart = details?.period?.start ?? null;
  const charged = details?.amounts ?? null;
  const amount = Number(charged?.price ?? purchase.price) || 0;
  const vat = Number(charged?.vat ?? purchase.vat) || 0;
  const ait = Number(purchase.ait) || 0;
  const total = amount + vat + ait;
  const status = packageExpiry && new Date(packageExpiry) < new Date() ? 'EXPIRED' : 'ACTIVE';
  const invoiceDue = invoiceDueDate(purchaseDate, isPrepaid);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  const formatDateObj = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${esc(invoiceId)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #F0F7FE; padding: 24px; color: #1f2937; }
          .invoice { max-width: 820px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(13, 82, 158, 0.08); border: 1px solid #E5F2FB; }
          .header { background: linear-gradient(135deg, #0D529E, #1F3C71); color: white; padding: 32px; position: relative; }
          .header::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: linear-gradient(90deg, #0D529E, #28A8E0); }
          .header h1, .header h2 { font-size: 24px; margin-bottom: 6px; }
          .header p { opacity: 0.92; font-size: 13px; line-height: 1.6; }
          .company-info { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 18px; }
          .company-info div { font-size: 13px; }
          .content { padding: 32px; }
          .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #E5F2FB; }
          .invoice-meta h2 { color: #0D529E; font-size: 22px; margin-bottom: 4px; font-weight: 700; }
          .invoice-meta .details { text-align: right; }
          .invoice-meta .details p { margin: 3px 0; color: #6b7280; font-size: 13px; }
          .invoice-meta .details strong { color: #1f2937; font-weight: 600; }
          .bill-to { margin-bottom: 20px; padding: 16px 20px; background: rgba(40, 168, 224, 0.05); border: 1px solid rgba(40, 168, 224, 0.2); border-radius: 12px; }
          .bill-to h3 { color: #0D529E; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; }
          .bill-to p { color: #1f2937; font-size: 15px; font-weight: 500; }
          .items-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px; border: 1px solid #E5F2FB; border-radius: 12px; overflow: hidden; }
          .items-table th { background: rgba(40, 168, 224, 0.1); padding: 14px 16px; text-align: left; font-weight: 600; color: #1F3C71; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .items-table td { padding: 16px; border-top: 1px solid #f3f4f6; color: #374151; font-size: 14px; }
          .items-table .amount { text-align: right; font-weight: 600; color: #1f2937; }
          .totals { margin-left: auto; width: 320px; }
          .totals .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #4b5563; }
          .totals .row.total { border-bottom: none; border-top: 2px solid #0D529E; margin-top: 12px; padding-top: 16px; font-size: 18px; font-weight: 700; color: #0D529E; }
          .status { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px solid; }
          .status.paid, .status.active { background: rgba(40, 168, 224, 0.15); color: #1F3C71; border-color: rgba(40, 168, 224, 0.3); }
          .status.pending { background: #FEF3C7; color: #B45309; border-color: #FDE68A; }
          .status.expired { background: #FEE2E2; color: #B91C1C; border-color: #FECACA; }
          .payment-type { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 10px; font-weight: 600; margin-left: 10px; border: 1px solid; text-transform: uppercase; letter-spacing: 0.5px; }
          .payment-type.prepaid { background: rgba(40, 168, 224, 0.15); color: #0D529E; border-color: rgba(40, 168, 224, 0.3); }
          .payment-type.postpaid { background: rgba(40, 168, 224, 0.25); color: #1F3C71; border-color: rgba(40, 168, 224, 0.5); }
          .bill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .bill-grid .bill-to { margin-bottom: 0; }
          .kv { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 6px; }
          .kv td { padding: 3px 0; vertical-align: top; color: #1f2937; }
          .kv td:first-child { color: #6b7280; width: 38%; white-space: nowrap; padding-right: 10px; }
          .kv .mono { font-family: Consolas, monospace; font-size: 12px; word-break: break-all; }
          .bill-to .muted-note { color: #6b7280; font-size: 13px; font-weight: 400; margin-top: 6px; }
          .tag-custom { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-size: 11px; font-weight: 700; }
          .tag-paid { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; font-size: 11px; font-weight: 700; }
          @media (max-width: 600px) { .bill-grid { grid-template-columns: 1fr; } }
          .footer { background: rgba(40, 168, 224, 0.05); padding: 20px 32px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #E5F2FB; }
          .footer p { margin: 4px 0; }
          .footer h5 { color: #0D529E; font-weight: 600; }
          @media print {
            body { background: white; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            .invoice { box-shadow: none; border-color: transparent; }
            .header { background: linear-gradient(135deg, #0D529E, #1F3C71) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .header::after { background: linear-gradient(90deg, #0D529E, #28A8E0) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .status, .payment-type, .bill-to, .items-table th, .footer, .tag-custom, .tag-paid { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <img src="${esc(origin)}/btcllogo.png" alt="BTCL Logo" style="height: 60px; width: auto;" onerror="this.style.display='none'" />
              <div style="text-align: right;">
                <p style="margin: 0;">Bangladesh Telecommunications Company Limited</p>
              </div>
            </div>
            <div class="company-info">
              <div>
                <h2>BTCL Head Office</h2>
                <p>37/E, Telejogajog Bhaban, Eskaton Garden, Dhaka</p>
                <p>Telephone: +880248311500 (Office Time)</p>
                <p>Email: md@btcl.gov.bd</p>
              </div>
              <div style="text-align: right;">
                <h6 style="font-size: 14px; margin: 5px 0;">Website: www.btcl.gov.bd</h6>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="invoice-meta">
              <div>
                <h2>INVOICE <span class="payment-type ${isPrepaid ? 'prepaid' : 'postpaid'}">${paymentType}</span></h2>
                <p style="color: #0D529E; font-weight: 600; font-size: 18px; margin-top: 4px;">${esc(invoiceId)}</p>
              </div>
              <div class="details">
                <p><strong>Invoice Date:</strong> ${esc(formatDate(purchaseDate))}</p>
                <p><strong>Package Expire Date:</strong> ${esc(formatDate(expireDate))}</p>
                ${!isPrepaid ? `<p><strong>Invoice Due Date:</strong> ${esc(formatDateObj(invoiceDue))}</p>` : ''}
              </div>
            </div>

            ${partiesHtml(purchase, partnerName, details)}

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Purchase Date</th>
                  <th>Package Expire Date</th>
                  ${!isPrepaid ? '<th>Invoice Due Date</th>' : ''}
                  <th>Status</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong style="color: #1f2937;">${esc(pkgName)}</strong><br>
                    <span style="color: #6b7280; font-size: 12px;">Package Subscription</span>
                    ${periodStart && expireDate
                      ? `<br><span style="color: #6b7280; font-size: 12px;">Service period: ${esc(formatDate(periodStart))} – ${esc(formatDate(expireDate))}</span>`
                      : ''}
                  </td>
                  <td>${esc(formatDate(purchaseDate))}</td>
                  <td>${esc(formatDate(expireDate))}</td>
                  ${!isPrepaid ? `<td>${esc(formatDateObj(invoiceDue))}</td>` : ''}
                  <td><span class="status ${status.toLowerCase()}">${status}</span></td>
                  <td class="amount">৳${amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="row">
                <span>Subtotal</span>
                <span>৳${amount.toLocaleString()}</span>
              </div>
              ${vat > 0 ? `<div class="row"><span>VAT</span><span>৳${vat.toLocaleString()}</span></div>` : ''}
              ${ait > 0 ? `<div class="row"><span>AIT</span><span>৳${ait.toLocaleString()}</span></div>` : ''}
              <div class="row total">
                <span>Total</span>
                <span>৳${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <h5 style="font-size: 14px; margin: 5px 0;">Thank you for choosing BTCL!</h5>
            <p>For any queries, please contact our support team at: </p>
            <p>Phone:+880258312233 (Office Time) - Email: dgm.swmogbazar@btcl.gov.bd || noc@btcl.gov.bd</p>
            <h5 style="font-size: 14px; margin: 5px 0;">BTCL Call Center: 16402</h5>
            <p style="margin-top: 10px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </body>
      </html>
    `;
}

/**
 * Open the invoice in a new window and bring up the print dialog, where it saves as PDF.
 *
 * The window opens at once, on the click, and the details are fetched into it: a window opened
 * after a fetch is no longer the click's, and browsers block it as a popup.
 */
export async function openInvoice(
  purchase: InvoicePurchase & { idPartner?: number | null },
  options: InvoiceOptions,
  loadDetails?: () => Promise<InvoiceDetails | null>
): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice</title></head>' +
      '<body style="font-family: Segoe UI, Arial, sans-serif; color: #1F3C71; padding: 48px; text-align: center;">' +
      'Preparing your invoice…</body></html>'
  );
  let details: InvoiceDetails | null = null;
  if (loadDetails) {
    try {
      details = await loadDetails();
    } catch {
      details = null;
    }
  }
  if (printWindow.closed) return;
  const html = buildInvoiceHtml(purchase, options, window.location.origin, details);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}

/**
 * Who a purchase bills and how it was paid, from our own backend. Null when it cannot say,
 * and the invoice then prints without those details rather than with wrong ones.
 *
 * @param service the service the purchase was bought from (pbx, hcc, vbs, sms); each numbers
 *                its purchases on its own, so the id alone does not name one
 */
export async function fetchInvoiceDetails(
  apiBaseUrl: string,
  endpoint: string,
  purchaseId: number,
  service: string | null | undefined,
  authToken: string | null
): Promise<InvoiceDetails | null> {
  if (!authToken || !purchaseId) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(service ? { purchaseId, service } : { purchaseId }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as InvoiceDetails;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
