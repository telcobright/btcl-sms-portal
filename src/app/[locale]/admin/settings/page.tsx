'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  getNidCredentialStatus,
  nidCredentialErrorMessage,
  testNidCredential,
  updateNidCredential,
  type NidCredentialStatus,
} from '@/lib/api-client/nidCredential';

/**
 * ROLE_ADMIN-only settings for the EC NID verification integration.
 *
 * BTCL must rotate the Election Commission API password every month. That used to mean
 * editing application.properties inside the NIDVerification service, rebuilding the jar and
 * restarting it — so the credentials drifted out of git and nobody could tell when they were
 * last changed. This page writes them to tenant_master instead; the service picks the new
 * value up within a minute, with no restart.
 *
 * The status panel exists because a wrong password fails silently: registration simply stops
 * verifying NIDs. "Service reports" is the authoritative signal — it is written by the running
 * NID service after a real authentication attempt, not by this page.
 */
export default function AdminSettingsPage() {
  const [status, setStatus] = useState<NidCredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  const applyStatus = useCallback((next: NidCredentialStatus) => {
    setStatus(next);
    setUsername(next.username ?? '');
    setBaseUrl(next.baseUrl ?? '');
  }, []);

  const load = useCallback(
    async (showSpinner: boolean) => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      if (showSpinner) setLoading(true);
      try {
        applyStatus(await getNidCredentialStatus(authToken));
        setError(null);
      } catch (err) {
        setError(nidCredentialErrorMessage(err, 'Could not load the NID credential settings.'));
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [applyStatus]
  );

  useEffect(() => {
    load(true);
    // Keep the monitoring panel live without the admin having to reload.
    const timer = setInterval(() => load(false), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const handleTest = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setTesting(true);
    setBanner(null);
    try {
      // With a password typed in, trial those values without saving them; otherwise
      // test whatever is currently stored.
      const result = await testNidCredential(
        password ? { username, password, baseUrl } : {},
        authToken
      );
      setBanner({
        ok: result.ok,
        text: `${result.testedStored ? 'Saved credentials' : 'Entered credentials'}: ${result.message}`,
      });
      await load(false);
    } catch (err) {
      setBanner({ ok: false, text: nidCredentialErrorMessage(err, 'The test could not be run.') });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    if (!username.trim()) {
      setBanner({ ok: false, text: 'Username is required.' });
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const next = await updateNidCredential(
        {
          username: username.trim(),
          password: password || undefined,
          baseUrl: baseUrl.trim() || undefined,
          testBeforeSave: verifyBeforeSave,
        },
        authToken
      );
      applyStatus(next);
      setPassword('');
      setBanner({
        ok: true,
        text: `Saved. The NID service will use version ${next.version} within a minute — no restart needed.`,
      });
    } catch (err) {
      setBanner({ ok: false, text: nidCredentialErrorMessage(err, 'The credentials could not be saved.') });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (value: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  };

  const rotationDue =
    status?.daysSinceUpdate != null &&
    status?.rotationDays != null &&
    status.daysSinceUpdate >= status.rotationDays;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3C71] flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-[#0D529E]" />
            NID Verification Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Credentials for the Election Commission NID API. Changes apply without restarting the
            service.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#0D529E] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {banner && (
        <div
          className={`mb-5 flex items-start gap-2 p-4 rounded-lg border text-sm ${
            banner.ok
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {banner.ok ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      {/* ---------------- Monitoring ---------------- */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Service status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            title="NID service"
            ok={status?.serviceUp ?? null}
            value={status?.serviceUp ? 'Online' : 'Unreachable'}
            detail={
              status?.serviceResponseMs != null
                ? `${status.serviceMessage} · ${status.serviceResponseMs} ms`
                : status?.serviceMessage ?? '—'
            }
          />
          <StatusCard
            title="Last authentication"
            ok={status?.lastAuthOk ?? null}
            value={
              status?.lastAuthOk == null
                ? 'Not yet reported'
                : status.lastAuthOk
                  ? 'Succeeded'
                  : 'Failed'
            }
            detail={
              status?.lastAuthOk === false && status?.lastAuthError
                ? status.lastAuthError
                : `Reported by the service · ${formatTime(status?.lastAuthAt ?? null)}`
            }
          />
          <StatusCard
            title="Configuration in use"
            ok={status?.serviceInSync ?? null}
            value={
              status?.serviceInSync
                ? `Version ${status?.version} active`
                : status?.loadedVersion == null
                  ? 'Not yet confirmed'
                  : `Service still on v${status.loadedVersion}`
            }
            detail={
              status?.serviceInSync
                ? 'The running service has adopted the saved credentials.'
                : 'Updates are picked up within about a minute of the next verification.'
            }
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------------- Credential form ---------------- */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1F3C71] mb-1">EC API credentials</h2>
          <p className="text-sm text-gray-500 mb-5">
            BTCL rotates this password monthly. Saving here is all that is required — the service
            does not need to be rebuilt or restarted.
          </p>

          {rotationDue && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Last changed {status?.daysSinceUpdate} days ago — a rotation is due (every{' '}
                {status?.rotationDays} days).
              </span>
            </div>
          )}

          <div className="space-y-4">
            <Field label="Username">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
              />
            </Field>

            <Field
              label="Password"
              hint="Leave blank to keep the current password and only change the fields above."
            >
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={status?.passwordMasked ?? '••••••••••'}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="API base URL">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
              />
            </Field>

            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyBeforeSave}
                onChange={(e) => setVerifyBeforeSave(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0D529E]"
              />
              <span>
                Verify with the EC API before saving
                <span className="block text-xs text-gray-500">
                  Recommended. A wrong password is not otherwise noticed until a customer fails to
                  register.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || testing}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D529E] text-white text-sm font-medium rounded-lg hover:bg-[#1F3C71] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save credentials'}
            </button>
            <button
              onClick={handleTest}
              disabled={saving || testing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {testing ? 'Testing…' : password ? 'Test entered values' : 'Test saved credentials'}
            </button>
          </div>
        </section>

        {/* ---------------- Current record ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1F3C71] mb-4">Current record</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Version" value={`v${status?.version ?? '—'}`} />
            <Row label="Last changed" value={formatTime(status?.updatedAt ?? null)} />
            <Row label="Changed by" value={status?.updatedBy || '—'} />
            <Row
              label="Age"
              value={
                status?.daysSinceUpdate == null
                  ? '—'
                  : `${status.daysSinceUpdate} day${status.daysSinceUpdate === 1 ? '' : 's'}`
              }
            />
            <Row label="Last test" value={formatTime(status?.lastTestAt ?? null)} />
            <Row
              label="Test result"
              value={
                status?.lastTestOk == null ? '—' : status.lastTestOk ? 'Passed' : 'Failed'
              }
            />
          </dl>
          {status?.lastTestMessage && (
            <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 break-words">
              {status.lastTestMessage}
            </p>
          )}
        </section>
      </div>

      {/* ---------------- Audit trail ---------------- */}
      <section className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <h2 className="text-base font-semibold text-[#1F3C71] px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <History className="w-4 h-4" />
          Change history
        </h2>
        {!status?.recentChanges?.length ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">No changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>When</Th>
                  <Th>Action</Th>
                  <Th>Version</Th>
                  <Th>Username</Th>
                  <Th>By</Th>
                  <Th>Note</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {status.recentChanges.map((entry, index) => (
                  <tr key={`${entry.changedAt}-${index}`} className="hover:bg-gray-50">
                    <Td>{formatTime(entry.changedAt)}</Td>
                    <Td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.action === 'UPDATE'
                            ? 'bg-blue-50 text-[#0D529E]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {entry.action}
                      </span>
                    </Td>
                    <Td>v{entry.version}</Td>
                    <Td>{entry.username}</Td>
                    <Td>{entry.changedBy || '—'}</Td>
                    <Td className="text-gray-500 max-w-xs truncate" title={entry.note ?? ''}>
                      {entry.note || '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Traffic-light card. `ok === null` means "unknown", which is not the same as a failure. */
function StatusCard({
  title,
  ok,
  value,
  detail,
}: {
  title: string;
  ok: boolean | null;
  value: string;
  detail: string;
}) {
  const tone =
    ok === null
      ? { dot: 'bg-gray-400', text: 'text-gray-700', ring: 'border-gray-200' }
      : ok
        ? { dot: 'bg-green-500', text: 'text-green-700', ring: 'border-green-200' }
        : { dot: 'bg-red-500', text: 'text-red-700', ring: 'border-red-200' };

  return (
    <div className={`bg-white rounded-xl border ${tone.ring} shadow-sm p-4`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`w-2.5 h-2.5 rounded-full ${tone.dot}`} />
        <span className={`font-semibold ${tone.text}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2 break-words line-clamp-3">{detail}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium text-right break-words">{value}</dd>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-6 py-2.5 whitespace-nowrap">{children}</th>;
}

function Td({
  children,
  className = '',
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td className={`px-6 py-3 whitespace-nowrap ${className}`} title={title}>
      {children}
    </td>
  );
}
