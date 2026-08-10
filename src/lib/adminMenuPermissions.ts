/**
 * Per-user menu permissions for the /admin area.
 *
 * Scope, deliberately narrow:
 *   • Governs only this portal's own admin sidebar. Nothing here relates to the
 *     PBX portal's menu catalog or its partner-level config.
 *   • Applies only to ROLE_ADMIN accounts, which is the only role this codebase
 *     branches on.
 *   • An account with no saved rows sees everything, so nothing changes for
 *     existing admins until someone configures them. That also means the
 *     feature degrades to today's behaviour while the backend endpoints are
 *     still undeployed.
 *
 * menuKey is the locale-stripped route ('/admin/partners'). The sidebar builds
 * hrefs as `/${locale}/admin/...`, so the locale segment has to come off before
 * anything is compared.
 */

export type PermissionLevel = 'full' | 'readonly';

export interface MenuPermissionRow {
  menuKey: string;
  permissionLevel: PermissionLevel;
}

export interface AdminMenuCatalogEntry {
  menuKey: string;
  label: string;
  section: string;
}

const STORAGE_KEY = 'adminMenuPermissions';

export const LEVEL_FULL: PermissionLevel = 'full';
export const LEVEL_READONLY: PermissionLevel = 'readonly';

export const ADMIN_ROLES = ['ROLE_ADMIN'];

/**
 * The assignable menus, mirroring AdminSidebar's navSections.
 *
 * Kept as its own list rather than lifted out of the sidebar because those
 * items carry inline JSX icons and locale-interpolated hrefs, neither of which
 * belongs in a plain data module. The sidebar filter derives its key from the
 * href instead of reading this, so a menu added there but forgotten here simply
 * stays visible and unassignable — visible-by-default rather than hidden.
 */
export const ADMIN_MENU_CATALOG: AdminMenuCatalogEntry[] = [
  { menuKey: '/admin', label: 'Dashboard', section: 'Overview' },
  { menuKey: '/admin/partners', label: 'Partners', section: 'Management' },
  { menuKey: '/admin/reports', label: 'Sales Reports', section: 'Management' },
  { menuKey: '/admin/emails', label: 'Sent Emails', section: 'Management' },
  { menuKey: '/admin/backend-guide', label: 'Backend Guide', section: 'System' },
  { menuKey: '/admin/settings', label: 'Settings', section: 'System' },
  { menuKey: '/admin/service-details', label: 'Service Details', section: 'System' },
];

const CATALOG_KEYS = ADMIN_MENU_CATALOG.map((m) => m.menuKey);

const LOCALES = ['en', 'bn'];

/** '/en/admin/partners/1' -> '/admin/partners/1'. Leaves unprefixed paths alone. */
export const stripLocale = (path: string): string => {
  if (!path) return '';
  const segments = path.split('/');
  // ['', 'en', 'admin', ...]
  if (segments.length > 1 && LOCALES.includes(segments[1])) {
    return '/' + segments.slice(2).join('/');
  }
  return path;
};

/**
 * Resolves a route to the catalog key that governs it.
 * Longest match wins, because '/admin/partners/1' starts with both
 * '/admin' and '/admin/partners' and the more specific one is correct.
 * Returns null when nothing in the catalog covers the path.
 */
export const pathToMenuKey = (path: string): string | null => {
  const clean = (stripLocale(path) || '/').replace(/\/+$/, '') || '/admin';
  let best: string | null = null;
  for (const key of CATALOG_KEYS) {
    if (clean === key || clean.startsWith(key + '/')) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best;
};

/** The sidebar's own hrefs are full locale paths; same resolution. */
export const hrefToMenuKey = (href: string): string | null => pathToMenuKey(href);

// ── roles ──────────────────────────────────────────────────────────────────

/** Roles are written to localStorage at login as the JWT's `roles` claim. */
export const getCurrentRoles = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('userRoles');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((r: { name?: string }) => r?.name).filter(Boolean as unknown as (v: string | undefined) => v is string)
      : [];
  } catch {
    return [];
  }
};

export const isAdminRoleUser = (): boolean =>
  getCurrentRoles().some((r) => ADMIN_ROLES.includes(r));

// ── storage ────────────────────────────────────────────────────────────────

export const getAdminMenuPermissions = (): MenuPermissionRow[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setAdminMenuPermissions = (rows: MenuPermissionRow[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows || []));
  } catch {
    /* storage unavailable — falls back to unrestricted */
  }
};

export const clearAdminMenuPermissions = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

// ── checks ─────────────────────────────────────────────────────────────────

/**
 * Both halves matter: without the role check this would leak into any other
 * role, and without the rows check every existing admin would lose their whole
 * sidebar the moment this ships.
 */
export const isAdminMenuGatingActive = (): boolean =>
  isAdminRoleUser() && getAdminMenuPermissions().length > 0;

export const hasAdminMenuAccess = (menuKey: string | null): boolean => {
  if (!isAdminMenuGatingActive()) return true;
  if (!menuKey) return true; // not in the catalog — never a dead end
  return getAdminMenuPermissions().some((p) => p.menuKey === menuKey);
};

/** 'full' | 'readonly' | null (null = no access). */
export const getAdminMenuLevel = (menuKey: string | null): PermissionLevel | null => {
  if (!isAdminMenuGatingActive()) return LEVEL_FULL;
  if (!menuKey) return LEVEL_FULL;
  const found = getAdminMenuPermissions().find((p) => p.menuKey === menuKey);
  return found ? (found.permissionLevel || LEVEL_FULL) : null;
};

/** Whether a route allows create/edit/delete. */
export const canEditPath = (path: string): boolean => {
  if (!isAdminMenuGatingActive()) return true;
  const level = getAdminMenuLevel(pathToMenuKey(path));
  return level === null ? true : level === LEVEL_FULL;
};

/**
 * Route guard. The admin area is one subtree, so an un-granted page must not be
 * reachable by typing its URL — hiding the sidebar entry alone is not access
 * control. '/admin' itself is the redirect target and is never blocked.
 */
export const canAccessAdminPath = (path: string): boolean => {
  if (!isAdminMenuGatingActive()) return true;
  const key = pathToMenuKey(path);
  if (!key || key === '/admin') return true;
  return hasAdminMenuAccess(key);
};
