'use client';

import { BookOpen, ShieldCheck, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

/**
 * ROLE_ADMIN-only operating guide for administrator menu permissions.
 *
 * Access is enforced by the parent admin layout (src/app/[locale]/admin/layout.tsx),
 * which decodes the JWT and redirects anyone without ROLE_ADMIN, and then by the
 * menu guard in the same file.
 *
 * Content is deliberately honest about what is and is not enforced today — see the
 * "Read only" note. An SOP that overstates the protection is worse than none.
 */

const Section = ({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-6">
    <div className="flex items-baseline gap-3 mb-3">
      <span className="text-lg font-semibold text-[#0D529E] tabular-nums">{n}</span>
      <h2 className="text-lg font-bold text-[#1F3C71]">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">{children}</div>
  </section>
);

const Note = ({
  tone,
  title,
  children,
}: {
  tone: 'info' | 'warn' | 'ok';
  title: string;
  children: React.ReactNode;
}) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }[tone];
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'warn' ? AlertTriangle : ShieldCheck;
  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <p className="flex items-center gap-2 font-semibold text-[13px] mb-1.5">
        <Icon className="w-4 h-4 shrink-0" />
        {title}
      </p>
      <div className="text-[13.5px] leading-relaxed space-y-2">{children}</div>
    </div>
  );
};

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[12.5px] font-mono text-gray-800">
    {children}
  </code>
);

export default function AdminDocumentationPage() {
  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#0D529E] flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1F3C71]">Administrator Menu Permissions</h1>
          <p className="text-sm text-gray-500">
            How to control which admin menus each administrator can see, and what they can change.
          </p>
        </div>
      </div>

      <div className="space-y-9">
        <Section id="what" n="1" title="What this controls">
          <p>
            Menu permissions decide <strong>which of the admin menus an administrator sees</strong> in
            this portal. They are recorded against the individual account, so two administrators can
            sign in and see different menus.
          </p>
          <Note tone="info" title="An account with nothing recorded sees every menu">
            <p>
              Restriction begins only when someone deliberately grants menus. That is why nothing
              changed for existing administrators when this was introduced — and it is also how a
              restriction is undone.
            </p>
          </Note>
          <p>
            Only accounts holding <Code>ROLE_ADMIN</Code> are governed. Partner users and every other
            role are untouched and keep the access they have today.
          </p>
        </Section>

        <Section id="assign" n="2" title="Assigning permissions">
          <ol className="list-decimal pl-5 space-y-2 marker:text-gray-400 marker:font-medium">
            <li>
              Go to <strong>Partners</strong> and open the partner that holds your administrator
              accounts — normally <Code>/admin/partners/1</Code>.
            </li>
            <li>
              Open the <strong>Users</strong> tab.
            </li>
            <li>
              Find the administrator. Rows holding <Code>ROLE_ADMIN</Code> show a green{' '}
              <strong>Menus</strong> button; ordinary partner users do not, because they are not
              governed by this system.
            </li>
            <li>
              Tick each menu the person should see, and set <strong>Full</strong> or{' '}
              <strong>Read only</strong> beside it.
            </li>
            <li>
              Press <strong>Save Permissions</strong>.
            </li>
          </ol>
          <Note tone="warn" title="The change takes effect at their next sign-in">
            <p>
              The person must sign out and sign back in. Refreshing the page is not enough — this is
              the most common reason a change appears not to have worked.
            </p>
          </Note>
        </Section>

        <Section id="levels" n="3" title="What the settings do">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-[13.5px] min-w-[520px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-2.5 font-semibold">Setting</th>
                  <th className="px-4 py-2.5 font-semibold">Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">Not ticked</td>
                  <td className="px-4 py-3">
                    The menu is hidden, and typing its address returns them to the dashboard. A
                    section with nothing granted inside it disappears entirely.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">Full</td>
                  <td className="px-4 py-3">The menu is visible and everything on the page works normally.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">Read only</td>
                  <td className="px-4 py-3">
                    The menu is visible. <strong>On this portal it does not yet hide anything on the
                    page</strong> — see the note below.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Note tone="warn" title="Read only does not restrict pages on this portal yet">
            <p>
              Marking a menu Read only currently records your intent but changes nothing on the page —
              the buttons remain. If you need a real restriction today, leave the menu unticked so it
              is hidden entirely.
            </p>
            <p>
              More broadly, these permissions are an operational boundary rather than a security
              control: they work by hiding things in the browser, and the server will still accept a
              write that is crafted directly.
            </p>
          </Note>
        </Section>

        <Section id="verify" n="4" title="Checking that it worked">
          <ol className="list-decimal pl-5 space-y-2 marker:text-gray-400 marker:font-medium">
            <li>Have the person sign out and sign back in.</li>
            <li>Confirm the sidebar shows only the menus you granted.</li>
            <li>
              Type the address of a menu you did not grant — they should be returned to{' '}
              <Code>/admin</Code> instead of seeing the page.
            </li>
            <li>
              If it still looks wrong, open developer tools → <strong>Application</strong> →{' '}
              <strong>Local Storage</strong> and look for <Code>adminMenuPermissions</Code>. It should
              list the menus you granted.
            </li>
          </ol>
        </Section>

        <Section id="undo" n="5" title="Removing restrictions">
          <p>
            There is no separate action. Open the same <strong>Menus</strong> editor, press{' '}
            <strong>Clear</strong> so nothing is ticked, and save. Every recorded row is removed and
            the account returns to full access at its next sign-in.
          </p>
          <Note tone="ok" title="Use this when someone is locked out of something urgent">
            <p>It needs no deployment and no database work, and applies at their next sign-in.</p>
          </Note>
        </Section>

        <Section id="trouble" n="6" title="Troubleshooting">
          <p>
            If permissions cannot be loaded for any reason, the portal deliberately leaves the account
            with <strong>full access</strong> rather than locking the person out. That is the safer
            failure — but it means a fault looks exactly like &ldquo;no permissions set&rdquo;.
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-[13.5px] min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-2.5 font-semibold">Symptom</th>
                  <th className="px-4 py-2.5 font-semibold">What to do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3">They still see every menu</td>
                  <td className="px-4 py-3">Have them sign out fully and sign in again.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    Still every menu after re-signing in, and <Code>adminMenuPermissions</Code> is
                    empty
                  </td>
                  <td className="px-4 py-3">
                    Open the Network tab while they sign in and find{' '}
                    <Code>permissions/admin-user/get</Code>. A 404 means this server does not have the
                    permissions service yet; a 403 means the account was refused.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">The editor shows an amber &ldquo;not available&rdquo; notice</td>
                  <td className="px-4 py-3">
                    The permissions service is not deployed on this server yet. Nothing can be saved
                    until it is, and every administrator keeps full access meanwhile.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">No <strong>Menus</strong> button on a row</td>
                  <td className="px-4 py-3">
                    That account does not hold <Code>ROLE_ADMIN</Code>. Only administrator accounts can
                    be given menu permissions.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="rules" n="7" title="Points to remember">
          <ul className="list-disc pl-5 space-y-2 marker:text-gray-400">
            <li>
              <strong>Nothing recorded means full access.</strong> Intentional, and also how a
              restriction is undone.
            </li>
            <li>
              <strong>You cannot grant a menu you do not hold</strong>, and where you hold read-only
              you cannot grant full access.
            </li>
            <li>
              <strong>Only administrator accounts are affected.</strong> No other role&rsquo;s menus can
              change.
            </li>
            <li>
              <strong>The dashboard is never hidden.</strong> It is where blocked navigation lands, so
              it always stays reachable.
            </li>
            <li>
              <strong>This portal is separate.</strong> Permissions set here do not carry to the
              Softswitch Dashboard, and vice versa — different menus, different records.
            </li>
          </ul>
        </Section>

        <div className="flex items-start gap-2 pt-2 text-xs text-gray-400 border-t border-gray-200">
          <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            The list shown in the editor is always the authority on what this installation offers. If a
            menu is not in that list, this build does not have it.
          </p>
        </div>
      </div>
    </div>
  );
}
