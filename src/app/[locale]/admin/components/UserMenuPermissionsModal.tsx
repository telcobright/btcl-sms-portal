'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ADMIN_MENU_CATALOG,
  LEVEL_FULL,
  LEVEL_READONLY,
  getAdminMenuLevel,
  isAdminMenuGatingActive,
  type MenuPermissionRow,
  type PermissionLevel,
} from '@/lib/adminMenuPermissions';
import {
  getAdminUserMenuPermissions,
  saveAdminUserMenuPermissions,
} from '@/lib/api-client/permissions';

interface Props {
  userId: number;
  userName: string;
  onClose: () => void;
}

/**
 * Assigns which /admin menus one admin account can see, and at what level.
 *
 * Selection model: { [menuKey]: 'full' | 'readonly' } — present means granted at
 * that level, absent means hidden. Saving an empty selection stores no rows,
 * which the sidebar reads as unrestricted.
 */
export default function UserMenuPermissionsModal({ userId, userName, onClose }: Props) {
  const [selection, setSelection] = useState<Record<string, PermissionLevel>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Narrowed to what the assigner holds — you cannot hand out what you lack.
  const catalog = isAdminMenuGatingActive()
    ? ADMIN_MENU_CATALOG.filter((m) => getAdminMenuLevel(m.menuKey) !== null)
    : ADMIN_MENU_CATALOG;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken') || '';
        const rows = await getAdminUserMenuPermissions(userId, token);
        if (!alive) return;
        const next: Record<string, PermissionLevel> = {};
        rows.forEach((r) => {
          if (r?.menuKey) next[r.menuKey] = (r.permissionLevel || LEVEL_FULL) as PermissionLevel;
        });
        setSelection(next);
      } catch {
        // Endpoint not deployed on this tenant yet — say so rather than
        // showing an empty form that silently fails on save.
        if (alive) setUnavailable(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  /** Never let a grant exceed what the assigner holds on that same menu. */
  const capLevel = (menuKey: string, level: PermissionLevel): PermissionLevel => {
    const ceiling = getAdminMenuLevel(menuKey);
    if (level === LEVEL_FULL && ceiling && ceiling !== LEVEL_FULL) return LEVEL_READONLY;
    return level;
  };

  const toggle = (menuKey: string) =>
    setSelection((s) => {
      const next = { ...s };
      if (next[menuKey]) delete next[menuKey];
      else next[menuKey] = capLevel(menuKey, (getAdminMenuLevel(menuKey) || LEVEL_FULL) as PermissionLevel);
      return next;
    });

  const setLevel = (menuKey: string, level: PermissionLevel) =>
    setSelection((s) => ({ ...s, [menuKey]: capLevel(menuKey, level) }));

  const selectAll = () => {
    const next: Record<string, PermissionLevel> = {};
    catalog.forEach((m) => {
      next[m.menuKey] = capLevel(m.menuKey, (getAdminMenuLevel(m.menuKey) || LEVEL_FULL) as PermissionLevel);
    });
    setSelection(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rows: MenuPermissionRow[] = Object.entries(selection).map(
        ([menuKey, permissionLevel]) => ({ menuKey, permissionLevel })
      );
      const token = localStorage.getItem('authToken') || '';
      await saveAdminUserMenuPermissions(userId, rows, token);
      toast.success('Menu permissions saved');
      onClose();
    } catch {
      toast.error('Failed to save menu permissions');
    } finally {
      setSaving(false);
    }
  };

  const grantedCount = Object.keys(selection).length;
  const sections = Array.from(new Set(catalog.map((m) => m.section)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Menu Permissions</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Which admin menus {userName} can access
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
          ) : unavailable ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              The permissions service is not available on this server yet. Menu
              permissions cannot be assigned until it is deployed — every admin
              continues to see all menus in the meantime.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500">
                  {grantedCount === 0
                    ? 'Nothing selected — this admin will see every menu.'
                    : `${grantedCount} of ${catalog.length} menus granted.`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={selectAll}
                    className="text-xs font-medium text-[#0D529E] hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelection({})}
                    className="text-xs font-medium text-gray-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {sections.map((section) => (
                <div key={section} className="mb-5">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section}
                  </p>
                  <div className="space-y-1.5">
                    {catalog
                      .filter((m) => m.section === section)
                      .map((m) => {
                        const enabled = !!selection[m.menuKey];
                        const ceiling = getAdminMenuLevel(m.menuKey);
                        return (
                          <div
                            key={m.menuKey}
                            className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2"
                          >
                            <label className="flex items-center gap-2.5 min-w-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => toggle(m.menuKey)}
                                className="h-4 w-4 rounded border-gray-300 text-[#0D529E] focus:ring-[#0D529E]"
                              />
                              <span className="text-sm text-gray-800 truncate">{m.label}</span>
                            </label>
                            <div className="flex items-center gap-3 shrink-0">
                              {(['full', 'readonly'] as PermissionLevel[]).map((lvl) => (
                                <label
                                  key={lvl}
                                  className={`flex items-center gap-1.5 text-xs ${
                                    !enabled || (lvl === LEVEL_FULL && ceiling === LEVEL_READONLY)
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-600 cursor-pointer'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`level-${m.menuKey}`}
                                    checked={(selection[m.menuKey] || LEVEL_FULL) === lvl}
                                    disabled={
                                      !enabled ||
                                      (lvl === LEVEL_FULL && ceiling === LEVEL_READONLY)
                                    }
                                    onChange={() => setLevel(m.menuKey, lvl)}
                                    className="h-3.5 w-3.5 text-[#0D529E] focus:ring-[#0D529E]"
                                  />
                                  {lvl === LEVEL_FULL ? 'Full' : 'Read only'}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || unavailable}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0D529E] rounded-lg hover:bg-[#0a4180] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}
