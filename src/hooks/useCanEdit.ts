'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  canEditPath,
  getAdminMenuLevel,
  pathToMenuKey,
  type PermissionLevel,
} from '@/lib/adminMenuPermissions';

/**
 * Whether the current route allows create / edit / delete.
 *
 * A menu granted at 'readonly' is still reachable — that is the point of the
 * level — so hiding the sidebar entry cannot express it. Pages have to ask.
 *
 * Fails open: an admin with no saved rows, or a route outside the catalog,
 * gets `true`. Same posture as the sidebar filter, so a backend that is down
 * degrades to today's behaviour rather than freezing everyone out.
 *
 * The lazy initialiser reads localStorage during render, which is safe here
 * because the admin layout withholds its children until after mount — nothing
 * under /admin is ever server-rendered or hydrated, so there is no mismatch to
 * cause, and no flash of enabled buttons before the effect corrects them.
 */
export function useCanEdit(): boolean {
  const pathname = usePathname();
  const [canEdit, setCanEdit] = useState(() => canEditPath(pathname));

  useEffect(() => {
    setCanEdit(canEditPath(pathname));
  }, [pathname]);

  return canEdit;
}

/** 'full' | 'readonly' | null (no access — the layout guard will have redirected). */
export function useMenuLevel(): PermissionLevel | null {
  const pathname = usePathname();
  const [level, setLevel] = useState<PermissionLevel | null>(() =>
    getAdminMenuLevel(pathToMenuKey(pathname))
  );

  useEffect(() => {
    setLevel(getAdminMenuLevel(pathToMenuKey(pathname)));
  }, [pathname]);

  return level;
}
