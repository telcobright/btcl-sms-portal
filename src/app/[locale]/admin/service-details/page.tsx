'use client';

import {
  Boxes,
  Database,
  Download,
  Globe,
  KeyRound,
  Lock,
  Network,
  Server,
  Terminal,
} from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * ROLE_ADMIN-only "Service Details" reference: SSH access, server/VM/service mapping,
 * and shared infrastructure for the BTCL platform. Gated by the admin layout.
 *
 * CONFIDENTIAL: this page intentionally contains infrastructure credentials (admin-only).
 * "Download PDF" reuses the rendered doc HTML and prints it via a branded window.
 */

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
.doc table { width:100%; border-collapse:collapse; margin:10px 0; font-size:12.5px; }
.doc th { background:#0D529E; color:#fff; text-align:left; padding:7px 9px; font-weight:600; }
.doc td { border:1px solid #e2e8f0; padding:7px 9px; vertical-align:top; }
.doc tr:nth-child(even) td { background:#f8fafc; }
.doc .note { display:flex; gap:8px; background:#fff7ed; border-left:4px solid #f59e0b; color:#7c2d12; padding:10px 12px; border-radius:6px; margin:10px 0; font-size:13px; }
.doc .cred { background:#fef2f2; border:1px solid #fecaca; border-left:4px solid #ef4444; border-radius:8px; padding:12px 14px; margin:10px 0; }
.doc .cred .lbl { font-size:11px; font-weight:700; color:#b91c1c; text-transform:uppercase; letter-spacing:.04em; }
.doc .cred table { margin:8px 0 0; }
.doc .cred th { background:#b91c1c; }
.doc .lead { font-size:14.5px; color:#334155; }
.doc .pill { display:inline-block; background:#e0edfa; color:#0D529E; border-radius:10px; padding:1px 8px; font-size:11px; font-weight:600; }
.doc .secret { cursor:pointer; user-select:none; }
.doc .secret .sec-mask { display:inline-flex; align-items:center; gap:5px; background:#fee2e2; color:#b91c1c; border:1px dashed #fca5a5; border-radius:5px; padding:1px 7px; font-size:12px; font-weight:600; }
.doc .secret .sec-real { display:none; }
.doc .secret.revealed .sec-mask { display:none; }
.doc .secret.revealed .sec-real { display:inline; }
`;

const PRINT_CSS = `
@page { size:A4; margin:16mm 14mm; }
body { font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.print-header { border-bottom:3px solid #0D529E; padding-bottom:12px; margin-bottom:18px; }
.print-header .brand { font-size:22px; font-weight:800; color:#0D529E; }
.print-header .sub { font-size:13px; color:#64748b; margin-top:2px; }
.print-header .meta { font-size:11px; color:#94a3b8; margin-top:6px; }
.print-footer { margin-top:24px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center; }
.doc h2, .doc h3 { break-after:avoid; }
.doc pre.cmd, .doc table, .doc .note, .doc .cred { break-inside:avoid; }
/* PDF always shows the real credential values */
.secret .sec-mask { display:none !important; }
.secret .sec-real { display:inline !important; }
`;

/** Password hidden by default; click to reveal/hide. In the PDF the real value always shows. */
function Secret({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  return (
    <span
      className={`secret${shown ? ' revealed' : ''}`}
      onClick={() => setShown((s) => !s)}
      title={shown ? 'Click to hide' : 'Click to reveal'}
    >
      <span className="sec-mask">•••••••• click to view</span>
      <span className="sec-real">
        <code>{value}</code>
      </span>
    </span>
  );
}

export default function ServiceDetailsPage() {
  const docRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    const content = docRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) {
      alert(
        'Please allow pop-ups for this site to download the PDF, then try again.'
      );
      return;
    }
    const generated = new Date().toLocaleString('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>BTCL Platform — Service Details</title>
<style>${DOC_CSS}${PRINT_CSS}</style></head>
<body>
<div class="doc">
  <div class="print-header">
    <div class="brand">BTCL Communication Platform</div>
    <div class="sub">Service Details — Servers, VMs, Services &amp; SSH Access</div>
    <div class="meta">Generated ${generated} · CONFIDENTIAL — contains infrastructure credentials · authorised administrators only</div>
  </div>
  ${content}
  <div class="print-footer">BTCL Communication Platform · Service Details · CONFIDENTIAL — do not distribute outside authorised operations staff.</div>
</div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`);
    win.document.close();
    win.focus();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toolbar — not printed */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0D529E] flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F3C71]">
              Service Details
            </h1>
            <p className="text-sm text-gray-500">
              Servers, VMs, services and SSH access for the BTCL platform.
            </p>
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div ref={docRef} className="doc">
          <div className="note">
            <span>
              <strong>Confidential.</strong> This document contains
              infrastructure access credentials. It is restricted to authorised
              administrators — do not share outside the operations team.
            </span>
          </div>

          <h2>
            <Network className="w-5 h-5" /> 1. Overview
          </h2>
          <p className="lead">
            The BTCL communication platform runs on{' '}
            <strong>two groups of servers</strong> — the{' '}
            <strong>SBC group</strong>
            (voice / contact-center / PBX) and the <strong>
              SMS group
            </strong>{' '}
            (SMS gateway). Each server runs specific services (RouteSphere,
            Config Manager, FreeSWITCH, etc.) and they share a private WireGuard
            overlay network.
          </p>
          <ul>
            <li>
              <strong>SBC group — 4 servers</strong> (<code>sbc1</code>–
              <code>sbc4</code>), reached via gateway{' '}
              <code>114.130.145.75</code> on per-server SSH ports; private LAN{' '}
              <code>192.168.24.0/24</code>.
            </li>
            <li>
              <strong>SMS group — 2 servers</strong> (
              <code>dell-sms-master</code>, <code>dell-sms-slave</code>),
              reached via gateway <code>114.130.145.70</code>; private subnet{' '}
              <code>10.246.7.0/x</code>.
            </li>
          </ul>
          <p>
            Each server is reached by SSH on its group&apos;s gateway IP using
            the server&apos;s dedicated port.
          </p>

          <h2>
            <KeyRound className="w-5 h-5" /> 2. SSH access &amp; credentials
          </h2>
          <p>
            Connect as the <code>telcobright</code> user to the VM&apos;s host
            IP and SSH port. Authentication is by the provided SSH key
            (preferred) or password.
          </p>
          <pre className="cmd">
            ssh -p &lt;port&gt; telcobright@&lt;host-ip&gt; # example — sbc1:
            ssh -p 40001 telcobright@114.130.145.75
          </pre>

          <div className="cred">
            <div className="lbl">
              <Lock
                style={{
                  display: 'inline',
                  width: 12,
                  height: 12,
                  verticalAlign: '-1px',
                }}
              />{' '}
              Confidential — credentials
            </div>
            <p
              style={{ fontSize: '12px', color: '#7c2d12', margin: '6px 0 0' }}
            >
              Passwords are hidden — click{' '}
              <strong>•••••••• click to view</strong> to reveal each one.
            </p>
            <table>
              <tbody>
                <tr>
                  <td>
                    <strong>SSH user</strong>
                  </td>
                  <td>
                    <code>telcobright</code> (all VMs)
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>SSH key</strong>
                  </td>
                  <td>
                    Key-based login (key <code>mustafa</code>) — preferred,
                    passwordless
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>SSH password — SBC host (114.130.145.75)</strong>
                  </td>
                  <td>
                    <Secret value="!mN+xVY^nfYySFCY" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>sudo password (on the VMs)</strong>
                  </td>
                  <td>
                    <Secret value="Takay1#$ane%%" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>
                      SIP/PBX server hippbx (114.130.145.82, port 22)
                    </strong>
                  </td>
                  <td>
                    user <code>telcobright</code> / password{' '}
                    <Secret value="Takay1#$ane%%" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>MySQL (10.10.194.10:3306)</strong>
                  </td>
                  <td>
                    user <code>tbuser</code> / password{' '}
                    <Secret value="Takay1takaane$" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>
            <Terminal className="w-5 h-5" /> 3. Running commands
          </h2>
          <p>
            After connecting, service-management commands need <code>sudo</code>{' '}
            (enter the sudo password above when prompted):
          </p>
          <pre className="cmd">
            # connect to sbc1 ssh -p 40001 telcobright@114.130.145.75 # then, on
            the server: systemctl is-active configmanager routesphere # quick
            status sudo systemctl restart configmanager # manage a service sudo
            tail -f /var/log/routesphere/routesphere.log # live logs
          </pre>
          <p>
            The full start / stop / restart / status procedure is in the{' '}
            <strong>Backend Guide</strong> page.
          </p>

          <h2>
            <Server className="w-5 h-5" /> 4. SBC group — 4 servers (sbc1–sbc4)
          </h2>
          <p>
            Voice / contact-center / PBX servers, reached via gateway{' '}
            <code>114.130.145.75</code> on per-server SSH ports; private LAN{' '}
            <code>192.168.24.0/24</code>.
          </p>
          <table>
            <thead>
              <tr>
                <th>Server</th>
                <th>SSH</th>
                <th>Private IP</th>
                <th>Services running</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>sbc1</strong>
                </td>
                <td>
                  <code>114.130.145.75:40001</code>
                </td>
                <td>
                  <code>192.168.24.101</code>
                </td>
                <td>
                  RouteSphere <span className="pill">btcl_pbx</span> + Config
                  Manager — Hosted PBX / SMS gateway (Sigtran). Also the NGINX
                  edge &amp; this portal.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>sbc2</strong>
                </td>
                <td>
                  <code>114.130.145.75:40002</code>
                </td>
                <td>
                  <code>192.168.24.102</code>
                </td>
                <td>
                  RouteSphere <span className="pill">btcl_contact_center</span>{' '}
                  + Config Manager — Contact Center (IM + Voice).
                </td>
              </tr>
              <tr>
                <td>
                  <strong>sbc3</strong>
                </td>
                <td>
                  <code>114.130.145.75:40003</code>
                </td>
                <td>
                  <code>192.168.24.103</code>
                </td>
                <td>
                  RouteSphere <span className="pill">btcl_voice_broadcast</span>{' '}
                  + Config Manager — Voice Broadcasting.
                </td>
              </tr>
              <tr>
                <td>
                  <strong>sbc4</strong>
                </td>
                <td>
                  <code>114.130.145.75:40004</code>
                </td>
                <td>
                  <code>192.168.24.104</code>
                </td>
                <td>
                  Media — LiveKit (<code>:7880</code>) and contact-center web
                  frontend (<code>:3000</code>).
                </td>
              </tr>
            </tbody>
          </table>

          <h2>
            <Server className="w-5 h-5" /> 5. SMS group — 2 servers
          </h2>
          <p>
            SMS gateway servers, reached via gateway <code>114.130.145.70</code>
            ; private subnet <code>10.246.7.0/x</code>.
          </p>
          <table>
            <thead>
              <tr>
                <th>Server</th>
                <th>SSH</th>
                <th>Private IP</th>
                <th>Services running</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>dell-sms-master</strong>
                </td>
                <td>
                  <code>114.130.145.70:50001</code>
                </td>
                <td>
                  <code>10.246.7.102</code>
                </td>
                <td>
                  RouteSphere <span className="pill">btcl</span> + Config
                  Manager — SMS (dev/master).
                </td>
              </tr>
              <tr>
                <td>
                  <strong>dell-sms-slave</strong>
                </td>
                <td>
                  <code>114.130.145.70:50002</code>
                </td>
                <td>
                  <code>10.246.7.103</code>
                </td>
                <td>Standby / replica of dell-sms-master.</td>
              </tr>
            </tbody>
          </table>

          <h2>
            <Globe className="w-5 h-5" /> 6. Other servers
          </h2>
          <table>
            <thead>
              <tr>
                <th>Server</th>
                <th>SSH</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>hippbx</strong>
                </td>
                <td>
                  <code>114.130.145.82:22</code>
                </td>
                <td>
                  FusionPBX / FreeSWITCH SIP server + STUN/TURN (coturn). Domain{' '}
                  <code>ippbx.alaapcloud.gov.bd</code>.
                </td>
              </tr>
            </tbody>
          </table>

          <h2>
            <Database className="w-5 h-5" /> 7. Shared infrastructure
          </h2>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Address</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MySQL (primary)</td>
                <td>
                  <code>10.10.194.10:3306</code>
                </td>
                <td>
                  Databases: <code>btcl_sms</code>,{' '}
                  <code>btcl_contact_center</code>, <code>btcl</code>,{' '}
                  <code>btcl_voicebroadcasting</code>, <code>telcobright</code>,
                  plus <code>statemachine_*</code>. User <code>tbuser</code>{' '}
                  (see credentials).
                </td>
              </tr>
              <tr>
                <td>Redis (shared)</td>
                <td>
                  <code>10.10.199.30:6379</code>
                </td>
                <td>Shared cache / pub-sub across deployments.</td>
              </tr>
              <tr>
                <td>Kafka cluster</td>
                <td>
                  <code>10.10.199.20</code>, <code>10.10.198.20</code>,{' '}
                  <code>10.10.197.20</code> : <code>9092</code>
                </td>
                <td>
                  3 broker nodes serving both groups. Config-reload topic{' '}
                  <code>config_event_loader_&lt;tenant&gt;</code>.
                </td>
              </tr>
              <tr>
                <td>WireGuard overlay</td>
                <td>
                  <code>10.9.9.0/24</code>
                </td>
                <td>
                  Full-mesh encrypted tunnel between all hosts. Container
                  subnets in <code>10.10.0.0/16</code>.
                </td>
              </tr>
            </tbody>
          </table>

          <h2>
            <Globe className="w-5 h-5" /> 8. Public domains (NGINX / HTTPS)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Serves</th>
                <th>Backend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>a2psms.btcliptelephony.gov.bd</code>
                </td>
                <td>A2P / Bulk SMS API &amp; webhooks</td>
                <td>sbc2 RouteSphere</td>
              </tr>
              <tr>
                <td>
                  <code>cc.alaapcloud.gov.bd</code>
                </td>
                <td>Hosted Contact Center</td>
                <td>sbc2 RouteSphere</td>
              </tr>
              <tr>
                <td>
                  <code>vbs.alaapcloud.gov.bd</code>
                </td>
                <td>Voice Broadcast API</td>
                <td>RouteSphere</td>
              </tr>
              <tr>
                <td>
                  <code>www.alaapcloud.gov.bd</code>
                </td>
                <td>Messaging webhooks (Facebook / WhatsApp / Prosody)</td>
                <td>sbc1 RouteSphere</td>
              </tr>
            </tbody>
          </table>
          <p>
            Each domain also exposes a health/version check at{' '}
            <code>/api/v1/version</code> (see the Backend Guide).
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
    </div>
  );
}
