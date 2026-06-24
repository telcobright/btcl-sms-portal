'use client';

import { useRef } from 'react';
import { Download, Server, Activity, Power, RefreshCw, ScrollText, Database, AlertTriangle, BookOpen } from 'lucide-react';

/**
 * ROLE_ADMIN-only operational guide for the platform backend (RouteSphere + Config Manager).
 * Access is enforced by the parent admin layout (src/app/[locale]/admin/layout.tsx), which
 * decodes the JWT and redirects anyone without ROLE_ADMIN.
 *
 * "Download PDF" reuses the rendered doc HTML (single source of content) and prints it through
 * a clean, branded, self-contained window — the same window.print() approach the invoice
 * download uses, so no extra dependencies are needed.
 */

// Styling shared by the on-screen view AND the printable PDF (scoped under `.doc`).
const DOC_CSS = `
.doc { color:#1f2937; font-size:14px; line-height:1.65; }
.doc h2 { display:flex; align-items:center; gap:8px; font-size:18px; font-weight:700; color:#0D529E; margin:28px 0 10px; padding-bottom:6px; border-bottom:2px solid #e5edf6; }
.doc h2:first-child { margin-top:0; }
.doc h3 { font-size:14px; font-weight:700; color:#1F3C71; margin:18px 0 6px; }
.doc p { margin:8px 0; }
.doc ul { margin:8px 0 8px 18px; padding:0; }
.doc li { margin:4px 0; }
.doc strong { color:#1F3C71; }
.doc code { background:#eef2f7; color:#0D529E; padding:1px 6px; border-radius:4px; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:12.5px; }
.doc pre.cmd { background:#0f172a; color:#e2e8f0; padding:12px 14px; border-radius:8px; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:12.5px; line-height:1.6; overflow-x:auto; margin:8px 0; white-space:pre-wrap; word-break:break-word; }
.doc pre.cmd .cm { color:#7dd3fc; }
.doc table { width:100%; border-collapse:collapse; margin:10px 0; font-size:13px; }
.doc th { background:#0D529E; color:#fff; text-align:left; padding:8px 10px; font-weight:600; }
.doc td { border:1px solid #e2e8f0; padding:8px 10px; vertical-align:top; }
.doc tr:nth-child(even) td { background:#f8fafc; }
.doc .note { display:flex; gap:8px; background:#fff7ed; border-left:4px solid #f59e0b; color:#7c2d12; padding:10px 12px; border-radius:6px; margin:10px 0; font-size:13px; }
.doc .note.warn { background:#fef2f2; border-left-color:#ef4444; color:#7f1d1d; }
.doc .lead { font-size:14.5px; color:#334155; }
`;

// Print-only additions (injected into the print window only).
const PRINT_CSS = `
@page { size:A4; margin:18mm 16mm; }
body { font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.print-header { border-bottom:3px solid #0D529E; padding-bottom:12px; margin-bottom:18px; }
.print-header .brand { font-size:22px; font-weight:800; color:#0D529E; }
.print-header .sub { font-size:13px; color:#64748b; margin-top:2px; }
.print-header .meta { font-size:11px; color:#94a3b8; margin-top:6px; }
.print-footer { margin-top:24px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center; }
.doc h2, .doc h3 { break-after:avoid; }
.doc pre.cmd, .doc table, .doc .note { break-inside:avoid; }
`;

export default function BackendGuidePage() {
  const docRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    const content = docRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) {
      alert('Please allow pop-ups for this site to download the PDF, then try again.');
      return;
    }
    const generated = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>BTCL Backend Operations Guide</title>
<style>${DOC_CSS}${PRINT_CSS}</style></head>
<body>
<div class="doc">
  <div class="print-header">
    <div class="brand">BTCL Communication Platform</div>
    <div class="sub">Backend Operations Guide — Start / Stop / Restart / Status</div>
    <div class="meta">Generated ${generated} · Confidential — for authorised administrators only</div>
  </div>
  ${content}
  <div class="print-footer">BTCL Communication Platform · Backend Operations Guide · This document is intended for authorised operations staff.</div>
</div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`);
    win.document.close();
    win.focus();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toolbar — not part of the printed document */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0D529E] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F3C71]">Backend Operations Guide</h1>
            <p className="text-sm text-gray-500">How to start, stop, restart and check the status of the platform backend.</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D529E] text-white text-sm font-semibold hover:bg-[#0a4380] transition-colors shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Document body — captured verbatim for the PDF */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div ref={docRef} className="doc">
          <h2><Activity className="w-5 h-5" /> 1. Overview — How the backend works</h2>
          <p className="lead">
            The BTCL communication platform backend is made up of <strong>two services</strong> that run on each
            application server. Together they handle every call and SMS end-to-end.
          </p>
          <ul>
            <li><strong>RouteSphere</strong> — the core engine. It receives every call and SMS, identifies the
              customer/partner, applies routing rules, performs real-time billing (balance check, rating, charging),
              and writes a <strong>Call Detail Record (CDR)</strong> for every call.</li>
            <li><strong>Config Manager</strong> — the configuration service. It serves each server&apos;s configuration
              (partners, rates, routing, packages) from the database and pushes <strong>live configuration updates</strong>
              to RouteSphere so most changes take effect <strong>without a restart</strong>.</li>
          </ul>
          <p>
            Both run as Linux <code>systemd</code> services and start automatically when the server boots. RouteSphere
            relies on Config Manager for its configuration, so <strong>Config Manager must be running first</strong>.
          </p>

          <h2><Server className="w-5 h-5" /> 2. Components &amp; servers</h2>
          <table>
            <thead><tr><th>Service</th><th>Service name</th><th>Role</th><th>Status port</th></tr></thead>
            <tbody>
              <tr><td><strong>RouteSphere</strong></td><td><code>routesphere</code></td><td>Call &amp; SMS routing, billing, CDR generation</td><td><code>19999</code></td></tr>
              <tr><td><strong>Config Manager</strong></td><td><code>configmanager</code></td><td>Serves configuration &amp; live config reload</td><td><code>7071</code> (internal)</td></tr>
            </tbody>
          </table>
          <p>Each application server runs its own pair of services, for example:</p>
          <table>
            <thead><tr><th>Server</th><th>Role</th></tr></thead>
            <tbody>
              <tr><td><code>sbc1</code></td><td>Hosted PBX / voice</td></tr>
              <tr><td><code>sbc2</code></td><td>Contact Center</td></tr>
            </tbody>
          </table>

          <h3>Public access (via NGINX over HTTPS)</h3>
          <p>External systems reach RouteSphere through <strong>NGINX</strong> (HTTPS), which routes each public domain to the backend service:</p>
          <table>
            <thead><tr><th>Public endpoint</th><th>Serves</th><th>Routed to</th></tr></thead>
            <tbody>
              <tr><td><code>https://a2psms.btcliptelephony.gov.bd</code></td><td>A2P / Bulk SMS API &amp; webhooks (<code>/api/v1/webhook/</code>, <code>/api/v2</code>)</td><td>RouteSphere <code>:19999</code></td></tr>
              <tr><td><code>https://services.btcliptelephony.gov.bd</code></td><td>Messaging webhooks — Facebook / WhatsApp / Prosody (<code>/webhook/…</code>, <code>/api/v2/</code>)</td><td>RouteSphere <code>:19999</code></td></tr>
              <tr><td><code>https://vbs.btcliptelephony.gov.bd</code></td><td>Voice Broadcast API (<code>/api/v1/</code>)</td><td>RouteSphere <code>:19999</code></td></tr>
              <tr><td><code>https://hcc.btcliptelephony.gov.bd</code></td><td>Hosted Contact Center</td><td>RouteSphere <code>:19999</code> (sbc2 — same backend as a2psms)</td></tr>
            </tbody>
          </table>
          <p>A read-only <strong>health/version endpoint</strong> is published on each domain at <code>/api/v1/version</code> (see section 3). Config Manager (<code>:7071</code>) remains <strong>internal</strong> — it is not exposed through NGINX and is managed on the server.</p>

          <h2><Activity className="w-5 h-5" /> 3. Check service status</h2>
          <p>All commands below are run <strong>on the application server</strong> (connect with <code>ssh &lt;user&gt;@&lt;server&gt;</code>). Most commands require <code>sudo</code>.</p>
          <h3>Is it running?</h3>
          <pre className="cmd">systemctl is-active configmanager routesphere</pre>
          <p>Prints <code>active</code> for each service that is running. For full detail (uptime, recent log lines):</p>
          <pre className="cmd">sudo systemctl status configmanager
sudo systemctl status routesphere</pre>
          <h3>Is the application healthy?</h3>
          <p>RouteSphere publishes a read-only version/health endpoint through <strong>NGINX (HTTPS)</strong> for each backend, so it can be checked from anywhere — a browser or <code>curl</code>:</p>
          <table>
            <thead><tr><th>Backend</th><th>Public health URL</th></tr></thead>
            <tbody>
              <tr><td>SMS &amp; Contact Center (sbc2)</td><td><code>https://a2psms.btcliptelephony.gov.bd/api/v1/version</code><br/>also <code>https://hcc.btcliptelephony.gov.bd/api/v1/version</code></td></tr>
              <tr><td>Hosted PBX / messaging (sbc1)</td><td><code>https://services.btcliptelephony.gov.bd/api/v1/version</code></td></tr>
            </tbody>
          </table>
          <pre className="cmd">curl -s https://a2psms.btcliptelephony.gov.bd/api/v1/version</pre>
          <p>A healthy service returns version JSON, for example:</p>
          <pre className="cmd">{`{"project":"routesphere-core","tag":"v...","tenant":"...","profile":"...","deployed_at":"..."}`}</pre>
          <p>The same endpoint is also reachable on the server itself: <code>curl -s http://localhost:19999/api/v1/version</code></p>
          <div className="note"><span>If the JSON does not return, the service is still starting or not healthy — check the logs (section 7).</span></div>

          <h2><Power className="w-5 h-5" /> 4. Start, stop &amp; restart</h2>
          <div className="note warn"><span><strong>Order matters:</strong> always start (or restart) <strong>Config Manager first</strong>, then RouteSphere. When stopping, stop RouteSphere first.</span></div>
          <h3>Start</h3>
          <pre className="cmd">sudo systemctl start configmanager
sudo systemctl start routesphere</pre>
          <h3>Stop</h3>
          <pre className="cmd">sudo systemctl stop routesphere
sudo systemctl stop configmanager</pre>
          <h3>Restart (e.g. after a version or configuration change)</h3>
          <pre className="cmd">sudo systemctl restart configmanager
sudo systemctl restart routesphere</pre>
          <div className="note"><span>RouteSphere takes roughly <strong>30–60 seconds</strong> to fully start. Wait, then verify with section 5.</span></div>

          <h2><RefreshCw className="w-5 h-5" /> 5. Verify after a restart</h2>
          <p>After starting or restarting, confirm the platform is healthy:</p>
          <ul>
            <li>Both services report <code>active</code>:
              <pre className="cmd">systemctl is-active configmanager routesphere</pre>
            </li>
            <li>RouteSphere answers its health endpoint with version JSON (public URL, or <code>http://localhost:19999/api/v1/version</code> on the server):
              <pre className="cmd">curl -s https://a2psms.btcliptelephony.gov.bd/api/v1/version</pre>
            </li>
            <li>The log shows normal startup with no repeating errors (section 7).</li>
          </ul>

          <h2><ScrollText className="w-5 h-5" /> 6. Logs</h2>
          <table>
            <thead><tr><th>Service</th><th>Log file</th></tr></thead>
            <tbody>
              <tr><td>RouteSphere</td><td><code>/var/log/routesphere/routesphere.log</code><br/>errors: <code>/var/log/routesphere/routesphere-error.log</code></td></tr>
              <tr><td>Config Manager</td><td><code>/var/log/configmanager/configmanager.log</code></td></tr>
            </tbody>
          </table>
          <p>Watch logs live:</p>
          <pre className="cmd">sudo tail -f /var/log/routesphere/routesphere.log
sudo journalctl -u routesphere -f</pre>

          <h2><Database className="w-5 h-5" /> 7. Call records (CDR)</h2>
          <p>RouteSphere writes a Call Detail Record for every call to CSV files on the server:</p>
          <pre className="cmd">/home/telcobright/Documents/cdr/</pre>
          <p>
            Files rotate over time and are named like <code>cdr_file_YYYY-MM-DD_HH-MM.csv</code>. A file currently being
            written lives in the <code>inprogress/</code> sub-folder and is flushed to the main folder once complete.
            Each row contains the calling/called numbers, start/answer/end times, duration and hangup cause.
          </p>

          <h2><AlertTriangle className="w-5 h-5" /> 8. Troubleshooting</h2>
          <ul>
            <li><strong>A service won&apos;t start / keeps restarting</strong> — check the error log:
              <pre className="cmd">sudo tail -50 /var/log/routesphere/routesphere-error.log</pre>
            </li>
            <li><strong>A configuration change isn&apos;t taking effect</strong> — make sure Config Manager is running.
              RouteSphere applies live updates automatically; if needed, restart RouteSphere (section 4).</li>
            <li><strong>After any restart</strong> — always run the verification checks in section 5.</li>
            <li><strong>Remember the order</strong> — Config Manager must be up before RouteSphere.</li>
          </ul>

          <h2><BookOpen className="w-5 h-5" /> 9. Quick reference</h2>
          <table>
            <thead><tr><th>Task</th><th>Command</th></tr></thead>
            <tbody>
              <tr><td>Check status</td><td><code>systemctl is-active configmanager routesphere</code></td></tr>
              <tr><td>Start</td><td><code>sudo systemctl start configmanager &amp;&amp; sudo systemctl start routesphere</code></td></tr>
              <tr><td>Stop</td><td><code>sudo systemctl stop routesphere &amp;&amp; sudo systemctl stop configmanager</code></td></tr>
              <tr><td>Restart</td><td><code>sudo systemctl restart configmanager &amp;&amp; sudo systemctl restart routesphere</code></td></tr>
              <tr><td>Health check (public)</td><td><code>curl -s https://a2psms.btcliptelephony.gov.bd/api/v1/version</code></td></tr>
              <tr><td>Live logs</td><td><code>sudo tail -f /var/log/routesphere/routesphere.log</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* On-screen styling for the document body (shared with the PDF). */}
      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
    </div>
  );
}
