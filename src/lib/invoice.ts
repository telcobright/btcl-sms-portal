/**
 * The purchase invoice, laid out as BTCL's "BILL (Subscriber Copy)", shared so the customer
 * dashboard and the admin partner page produce the same document. It opens as a page in a new
 * window and the print dialog saves it as PDF (one A4 page).
 *
 * The subscriber block is the partner record (address, email, mobile) and Payment Details is
 * the gateway payment the purchase was made with (method, TrnX number, TrnX time), or CUSTOM
 * where there was none, both from /package/invoice-details. The logos are in public/invoice.
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
  /** The service it was bought from (pbx, hcc, vbs, sms), which names the bill. */
  service?: string | null;
}

export interface InvoiceOptions {
  /** Prepaid accounts have no due date; postpaid ones are due on the 1st of next month. */
  isPrepaid: boolean;
  /** Used when the purchase record carries no customer name. */
  billTo?: string | null;
  /** INDIVIDUAL, CORPORATE, GOVERNMENT_INDIVIDUAL or GOVERNMENT_CORPORATE: Category and Subscriber Type. */
  customerCategory?: string | null;
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
  /**
   * The subscriber's numbers (every DID assigned to the partner, earliest first) and BTCL
   * areas, when the backend sends them; blank otherwise.
   */
  subscriber?: {
    dids?: string[] | null;
    ipTelephoneNo?: string | null;
    cgmArea?: string | null;
    dgmArea?: string | null;
  } | null;
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

/** "2026-11-15T10:00:00" as "15/11/2026": the date as written, never shifted to the viewer's zone. */
export function formatDmy(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Dhaka' });
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowThousand(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function integerInWords(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  for (const [size, name] of [[1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']] as const) {
    if (n >= size) {
      parts.push(`${belowThousand(Math.floor(n / size))} ${name}`);
      n %= size;
    }
  }
  if (n > 0) parts.push(belowThousand(n));
  return parts.join(' ');
}

/** 115 as "One Hundred Fifteen Taka Only"; 115.5 adds "and Fifty Paisa". */
export function takaInWords(amount: number): string {
  const rounded = Math.round(Math.max(0, amount) * 100);
  const taka = Math.floor(rounded / 100);
  const paisa = rounded % 100;
  return `${integerInWords(taka)} Taka${paisa ? ` and ${integerInWords(paisa)} Paisa` : ''} Only`;
}

/** ["09695000000", "09695000001", "09695000002"] as "09695000000 + 2 more". */
export function didSummary(dids: Array<string | null | undefined> | null | undefined, fallback?: string | null): string | null {
  const list = (dids ?? []).map((d) => (d ?? '').trim()).filter(Boolean);
  if (list.length === 0) return fallback?.trim() || null;
  return list.length === 1 ? list[0] : `${list[0]} + ${list.length - 1} more`;
}

/** The country code the partner record keeps ("…, 1207, BD") written out: "…, 1207, Bangladesh". */
function countryInFull(address: string | null | undefined): string | null | undefined {
  return address?.replace(/(^|,\s*)BD(?=\s*(,|$))/g, '$1Bangladesh');
}

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The product the bill is for, as the header's second line names it. */
function billProduct(service: string | null | undefined, individual: boolean): string {
  if (individual) return 'IP-TELEPHONE BILL';
  switch (service) {
    case 'pbx':
      return 'IP-PBX BILL';
    case 'hcc':
      return 'CONTACT CENTER BILL';
    case 'vbs':
      return 'VOICE BROADCAST BILL';
    case 'sms':
      return 'BULK SMS BILL';
    default:
      return 'SERVICE BILL';
  }
}

export function buildInvoiceHtml(
  purchase: InvoicePurchase & { idPartner?: number | null },
  options: InvoiceOptions,
  origin: string,
  details?: InvoiceDetails | null
): string {
  const { isPrepaid } = options;
  const dash = '—';
  const text = (value: unknown) =>
    value === null || value === undefined || String(value).trim() === '' ? dash : esc(value);

  const paymentType = isPrepaid ? 'Prepaid' : 'Postpaid';
  const invoiceId = `INV-${purchase.id || '00000'}`;
  const pkgName = purchase.packageName || 'Package';
  const description = pkgName.replace(/_/g, ' ');
  const bill = details?.billTo ?? null;
  const pay = details?.payment ?? null;
  const subscriber = details?.subscriber ?? null;
  const partnerName = bill?.name || purchase.partnerName || options.billTo || 'Customer';
  const customerId = bill?.idPartner ?? purchase.idPartner ?? null;
  const purchaseDate = purchase.purchaseDate ?? null;
  // The package's state comes from its own expiry; the dates printed are this payment's period.
  const packageExpiry = purchase.expireDate ?? null;
  const expireDate = details?.period?.end ?? packageExpiry;
  const periodStart = details?.period?.start ?? purchaseDate;
  const charged = details?.amounts ?? null;
  const amount = Number(charged?.price ?? purchase.price) || 0;
  const vat = Number(charged?.vat ?? purchase.vat) || 0;
  const ait = Number(purchase.ait) || 0;
  const total = amount + vat + ait;
  const vatRate = amount > 0 && vat > 0 ? Math.round((vat / amount) * 100) : null;
  const status = packageExpiry && new Date(packageExpiry) < new Date() ? 'EXPIRED' : 'ACTIVE';
  const invoiceDue = invoiceDueDate(purchaseDate, isPrepaid);

  // INDIVIDUAL, GOVERNMENT_INDIVIDUAL, CORPORATE, GOVERNMENT_CORPORATE.
  const category = (options.customerCategory ?? '').toUpperCase();
  const individual = category.endsWith('INDIVIDUAL');
  const government = category.startsWith('GOVERNMENT');
  const baseCategory = category ? (individual ? 'Individual' : 'Corporate') : null;
  const subscriberType = category
    ? `${government ? 'Government ' : ''}${baseCategory} ${paymentType}`
    : null;
  const titleLine = `ALAAP CLOUD ${individual ? 'INDIVIDUAL' : category ? 'CORPORATE' : ''}`.trim();
  const product = billProduct(purchase.service, individual);

  const boxRow = (label: string, value: string) =>
    `<div class="box-row"><span class="box-label">${esc(label)} :</span><span class="box-value">${value}</span></div>`;
  const infoRow = (label: string, value: string) =>
    `<tr><td class="il">${esc(label)}</td><td class="ic">:</td><td class="iv">${value}</td></tr>`;
  const payRow = (label: string, value: string, mono = false) =>
    `<tr><td class="pl">${esc(label)}</td><td class="pc">:</td><td class="pv${mono ? ' mono' : ''}">${value}</td></tr>`;

  let paymentRows: string;
  let paymentStatus: string;
  if (!pay || pay.available === false) {
    paymentRows = `<tr><td colspan="3" class="muted-note">Payment details are not available for this invoice just now.</td></tr>`;
    paymentStatus = `<span class="pill pill-pending">${isPrepaid ? 'PAID' : 'UNPAID'}</span>`;
  } else if (pay.custom) {
    paymentRows = [
      payRow('Payment Method', '<span class="pill pill-custom">CUSTOM</span>'),
      payRow('TrnX Number', dash, true),
      payRow('TrnX Time', esc(formatBst(pay.time ?? purchaseDate))),
    ].join('');
    paymentStatus = '<span class="pill pill-custom">RECORDED BY BTCL</span>';
  } else {
    paymentRows = [
      payRow('Payment Method', text(pay.method)),
      payRow('TrnX Number', text(pay.transactionId), true),
      pay.bankTransactionId ? payRow('Bank TrnX ID', esc(pay.bankTransactionId), true) : '',
      payRow('TrnX Time', esc(formatBst(pay.time))),
    ].join('');
    paymentStatus = '<span class="pill pill-paid">PAID</span>';
  }

  const blue = '#0D4F9C';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Alaap Cloud Bill – Subscriber Copy – ${esc(invoiceId)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono&display=swap">
<style>
  @page { size: A4; margin: 10mm 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  body { font-family: 'Roboto', Arial, sans-serif; color: #222; font-size: 13px; padding: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .bill { border: 1.5px solid ${blue}; position: relative; overflow: hidden; }
  .watermark { position: absolute; left: 50%; top: 58%; width: 560px; transform: translate(-50%, -50%); opacity: 0.07; pointer-events: none; z-index: 0; }
  .bill > *:not(.watermark) { position: relative; z-index: 1; }

  .head { display: flex; align-items: center; gap: 9px; padding: 9px 10px; background: #EEF3FA; border-bottom: 1px solid ${blue}; }
  .head .btcl { height: 52px; width: auto; }
  .head .alaap { height: 46px; width: 58px; object-fit: cover; border-radius: 10px; }
  .head .mid { flex: 1; text-align: center; }
  .head .mid .company { color: ${blue}; font-weight: 700; font-size: 8px; letter-spacing: 0; margin-bottom: 4px; white-space: nowrap; }
  .head .mid .copy { display: inline-block; border: 1.5px solid ${blue}; color: ${blue}; font-weight: 700; font-size: 14px; padding: 3px 10px; background: #fff; white-space: nowrap; }
  .head .title { text-align: center; }
  .head .title .t1 { font-weight: 700; font-size: 13.5px; letter-spacing: 0.3px; color: #111; line-height: 1.25; white-space: nowrap; }
  .head .title .inv { margin-top: 4px; font-size: 11.5px; color: #333; white-space: nowrap; }
  .head .title .inv strong { font-weight: 700; }
  .badge-type { display: inline-block; margin-left: 6px; padding: 1px 9px; border: 1.2px solid ${blue}; border-radius: 999px; color: ${blue}; font-weight: 700; font-size: 9.5px; background: #fff; }
  .head .seal { height: 60px; width: 58px; flex: none; object-fit: contain; }

  .office { text-align: center; padding: 7px 10px; font-size: 10px; line-height: 1.6; border-bottom: 1px solid ${blue}; color: #222; }
  .office strong { font-weight: 700; }

  .body { display: grid; grid-template-columns: 1fr 1fr; }
  .col { padding: 8px 10px 10px; }
  .col.left { border-right: 1.5px solid ${blue}; }
  .section-title { color: ${blue}; font-weight: 700; font-size: 13px; margin: 2px 0 7px; letter-spacing: 0.2px; }

  .address { border: 1px solid #b8c8e0; padding: 8px 10px 14px; margin-bottom: 12px; background: rgba(255,255,255,0.6); }
  .address .lbl { font-size: 12px; color: #333; }
  .address .name { font-size: 14.5px; font-weight: 700; margin: 3px 0 2px; color: #111; }
  .address .addr { font-size: 11.5px; line-height: 1.4; color: #222; white-space: pre-line; }

  .box-row { display: flex; align-items: center; margin-bottom: 6px; }
  .box-label { width: 44%; font-size: 12px; color: #222; }
  .box-value { flex: 1; border: 1px solid #b8c8e0; padding: 6px 9px; font-size: 12.5px; background: rgba(255,255,255,0.7); word-break: break-all; }

  table { border-collapse: collapse; width: 100%; }
  .info { margin-top: 6px; }
  .info td { padding: 5px 0; border-bottom: 1px solid #d6dee9; font-size: 11.5px; vertical-align: top; }
  .info .il { width: 31%; color: #222; }
  .info .ic { width: 10px; }
  .info .iv { color: #222; overflow-wrap: anywhere; }
  .status-active { color: ${blue}; font-weight: 700; }
  .status-expired { color: #C62828; font-weight: 700; }

  .items th { background: ${blue}; color: #fff; font-size: 11px; font-weight: 700; padding: 7px 5px; border-right: 1px solid #fff; text-align: center; }
  .items th:first-child { text-align: left; }
  .items th:last-child { border-right: none; }
  .items td { padding: 8px 5px; font-size: 11.5px; border-bottom: 1px solid #d6dee9; }
  .items .desc strong { display: block; font-weight: 700; font-size: 11.5px; line-height: 1.3; color: #111; }
  .items .desc span { font-size: 10.5px; color: #444; }
  .items .c { text-align: center; white-space: nowrap; }
  .items .r { text-align: right; white-space: nowrap; }
  .items tr.sum td { padding: 7px 6px; }
  .items tr.total td { font-weight: 700; }

  .net { display: flex; margin-top: 10px; }
  .net .k { flex: 1; background: ${blue}; color: #fff; font-weight: 700; font-size: 12.5px; padding: 9px 10px; }
  .net .v { width: 36%; border: 2px solid #D32F2F; text-align: center; font-weight: 700; font-size: 15px; padding: 6px; background: #fff; }
  .words { font-size: 10.5px; color: #333; margin: 7px 0 10px; }

  .pay td { padding: 6px 2px; border-bottom: 1px solid #d6dee9; font-size: 12px; vertical-align: top; }
  .pay .pl { width: 40%; }
  .pay .pc { width: 12px; }
  .pay .mono { font-family: 'Roboto Mono', Consolas, monospace; font-size: 10.5px; word-break: break-all; }
  .muted-note { color: #666; font-size: 11.5px; }

  .meta { margin-top: 12px; padding-top: 6px; border-top: 1px solid #555; font-size: 12px; line-height: 1.95; }
  .meta strong { font-weight: 700; }
  .pill { display: inline-block; padding: 0 11px; border-radius: 999px; font-size: 10.5px; font-weight: 700; line-height: 18px; margin-left: 3px; }
  .pill-paid { background: #E3F2DC; color: #2E7D32; border: 1px solid #9CCB8A; }
  .pill-pending { background: #FFF4E0; color: #A15C00; border: 1px solid #F0C27A; }
  .pill-custom { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; margin-left: 0; }
  .visit { text-align: center; color: ${blue}; font-weight: 700; font-size: 11.5px; margin-top: 10px; }

  .foot { background: #EEF3FA; border-top: 1.5px solid ${blue}; text-align: center; padding: 10px 10px; font-size: 11.5px; line-height: 1.7; }
  .foot .thanks { color: ${blue}; font-weight: 700; font-size: 13.5px; }
  .foot .cc { color: ${blue}; font-weight: 700; }
  .nb { text-align: center; font-size: 9.5px; color: #333; margin-top: 5px; letter-spacing: 0.2px; }

  @media print { body { padding: 0; } }
  @media (max-width: 640px) {
    .body { grid-template-columns: 1fr; }
    .col.left { border-right: none; border-bottom: 1.5px solid ${blue}; }
    .head { flex-wrap: wrap; justify-content: center; }
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="bill">
    <img class="watermark" src="${esc(origin)}/invoice/btcl-logo.png" alt="" onerror="this.style.display='none'" />

    <div class="head">
      <img class="btcl" src="${esc(origin)}/invoice/btcl-logo.png" alt="BTCL" onerror="this.style.display='none'" />
      <img class="alaap" src="${esc(origin)}/invoice/alaap-cloud.png" alt="Alaap Cloud" onerror="this.style.display='none'" />
      <div class="mid">
        <div class="company">Bangladesh Telecommunications Company Limited</div>
        <div class="copy">BILL (Subscriber Copy)</div>
      </div>
      <div class="title">
        <div class="t1">${esc(titleLine)}</div>
        <div class="t1">${esc(product)}</div>
        <div class="inv">Invoice: <strong>${esc(invoiceId)}</strong><span class="badge-type">${paymentType.toUpperCase()}</span></div>
      </div>
      <img class="seal" src="${esc(origin)}/invoice/govt-seal.png" alt="Government of Bangladesh" onerror="this.style.display='none'" />
    </div>

    <div class="office">
      <div><strong>BTCL Head Office:</strong> 37/E, Telejogajog Bhaban, Eskaton Garden, Dhaka</div>
      <div><strong>Tel:</strong> +880248311500 (Office Time) &nbsp;|&nbsp; <strong>Email:</strong> mdoffice@btcl.gov.bd &nbsp;|&nbsp; <strong>Web:</strong> www.btcl.gov.bd</div>
    </div>

    <div class="body">
      <div class="col left">
        <div class="section-title">INFORMATION</div>
        <div class="address">
          <div class="lbl">Subscriber's Name and Address :</div>
          <div class="name">${esc(partnerName)}</div>
          <div class="addr">${text(countryInFull(bill?.address))}</div>
        </div>

        ${boxRow('Customer ID', text(customerId))}
        ${boxRow('Invoice ID', esc(invoiceId))}
        ${boxRow('IP-Telephone No.', text(didSummary(subscriber?.dids, subscriber?.ipTelephoneNo)))}
        ${boxRow('Mobile No.', text(bill?.mobile))}
        ${boxRow('Email', text(bill?.email))}

        <table class="info">
          ${infoRow('Category', baseCategory ? `${esc(baseCategory)} (${paymentType})` : dash)}
          ${infoRow('Subscriber Type', text(subscriberType))}
          ${infoRow('Account Status', `<span class="status-${status.toLowerCase()}">${status}</span>`)}
          ${infoRow('Package', esc(pkgName))}
          ${infoRow('Service Period', `${esc(formatDmy(periodStart))} – ${esc(formatDmy(expireDate))}`)}
          ${infoRow('Invoice Date', esc(formatDmy(purchaseDate)))}
          ${infoRow('Purchase Date', esc(formatDmy(purchaseDate)))}
          ${infoRow('Package Expire Date', esc(formatDmy(expireDate)))}
          ${invoiceDue ? infoRow('Invoice Due Date', esc(invoiceDue.toLocaleDateString('en-GB'))) : ''}
        </table>
      </div>

      <div class="col right">
        <div class="section-title">BILL SUMMARY</div>
        <table class="items">
          <thead>
            <tr>
              <th style="width:42%">Description</th>
              <th>Purchase<br>Date</th>
              <th>Expire Date</th>
              <th>Charges<br>(Taka)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="desc"><strong>${esc(description)}</strong><span>Package Subscription</span></td>
              <td class="c">${esc(formatDmy(purchaseDate))}</td>
              <td class="c">${esc(formatDmy(expireDate))}</td>
              <td class="r">${money(amount)}</td>
            </tr>
            <tr class="sum"><td colspan="3">SUBTOTAL</td><td class="r">${money(amount)}</td></tr>
            <tr class="sum"><td colspan="3">VAT${vatRate !== null ? ` (${vatRate}%)` : ''}</td><td class="r">${money(vat)}</td></tr>
            ${ait > 0 ? `<tr class="sum"><td colspan="3">AIT</td><td class="r">${money(ait)}</td></tr>` : ''}
            <tr class="sum total"><td colspan="3">TOTAL</td><td class="r">${money(total)}</td></tr>
          </tbody>
        </table>

        <div class="net">
          <div class="k">${isPrepaid ? 'NET AMOUNT PAID (TAKA)' : 'NET AMOUNT (TAKA)'}</div>
          <div class="v">${money(total)}</div>
        </div>
        <div class="words">In words: ${esc(takaInWords(total))}</div>

        <div class="section-title">PAYMENT DETAILS</div>
        <table class="pay">${paymentRows}</table>

        <div class="meta">
          <div>Bill Type: <strong>${paymentType}</strong></div>
          <div>Payment Status: ${paymentStatus}</div>
          <div>CGM Area: ${esc(subscriber?.cgmArea ?? '')}</div>
          <div>DGM Area: ${esc(subscriber?.dgmArea ?? '')}</div>
        </div>
        <div class="visit">Visit alaapcloud.gov.bd for more services</div>
      </div>
    </div>

    <div class="foot">
      <div class="thanks">Thank you for choosing BTCL!</div>
      <div>For any queries, please contact our support team:</div>
      <div>Phone: +8802-58312233, +8809696996699 &nbsp;·&nbsp; Email: alaapcloud@btcl.gov.bd, noc@btcl.gov.bd</div>
      <div class="cc">BTCL Call Center: 16402</div>
    </div>
  </div>
  <div class="nb">N.B.: THIS IS A COMPUTER GENERATED BILL, SIGNATURE IS NOT MANDATORY</div>
</div>
</body>
</html>`;
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
  // Print once the logos and font have loaded, or after two seconds if they never do.
  let printed = false;
  const print = () => {
    if (printed || printWindow.closed) return;
    printed = true;
    printWindow.print();
  };
  printWindow.addEventListener('load', () => setTimeout(print, 150));
  setTimeout(print, 2000);
}

/**
 * Who a purchase bills and how it was paid, from our own backend. Null when it cannot say,
 * and the invoice then prints without those details rather than with wrong ones.
 *
 * Its subscriber.dids are the partner's DIDs from the database the purchase is in (the
 * service's own for pbx, hcc, vbs, sms), for the IP-Telephone No. field.
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

/** The period one purchase paid for, in Bangladesh time, as "2026-11-14T19:51:34". */
export interface PurchasePeriod {
  start?: string | null;
  end?: string | null;
}

/**
 * The period each of a partner's purchases paid for, keyed "service:id" (service "main" for
 * the main backend's own). A renewal moves the plan's own expiry forward, so the first
 * purchase of a renewed plan no longer says when its month ended; the tables show this
 * instead. Services that cannot answer are left out, and their rows keep their own dates.
 */
export async function fetchPurchasePeriods(
  apiBaseUrl: string,
  endpoint: string,
  idPartner: number | null | undefined,
  services: Array<string | null | undefined>,
  authToken: string | null
): Promise<Record<string, PurchasePeriod>> {
  const out: Record<string, PurchasePeriod> = {};
  if (!authToken || !idPartner) return out;
  const distinct = Array.from(new Set(services.map((s) => (s && s !== 'main' ? s : 'main'))));
  await Promise.all(
    distinct.map(async (service) => {
      try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(service === 'main' ? { idPartner } : { idPartner, service }),
        });
        if (!response.ok) return;
        const data = (await response.json()) as { periods?: Record<string, PurchasePeriod> };
        Object.entries(data.periods ?? {}).forEach(([id, period]) => {
          out[`${service}:${id}`] = period;
        });
      } catch {
        // This service's rows keep their own dates.
      }
    })
  );
  return out;
}

/** The start of a period when it is a different day from the purchase: an early renewal. */
export function periodStartIfLater(
  period: PurchasePeriod | undefined,
  purchaseDate: string | null | undefined
): string | null {
  if (!period?.start || !purchaseDate) return null;
  const start = new Date(period.start);
  const bought = new Date(purchaseDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(bought.getTime())) return null;
  return start.toDateString() !== bought.toDateString() && start > bought ? period.start : null;
}
