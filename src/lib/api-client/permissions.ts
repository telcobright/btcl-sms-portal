import axios from 'axios';
import { AUTH_BASE_URL, API_ENDPOINTS } from '@/config/api';
import type { MenuPermissionRow } from '@/lib/adminMenuPermissions';

/**
 * Per-user menu permissions for the /admin area.
 *
 * Both calls are written to fail soft at the call site rather than here: the
 * endpoints may not be deployed on this tenant yet, and an admin must never be
 * locked out of their own dashboard because a lookup 404'd.
 */

/** Rows for one admin account. An empty list means unrestricted. */
export const getAdminUserMenuPermissions = async (
  userId: number,
  authToken: string
): Promise<MenuPermissionRow[]> => {
  const response = await axios.post(
    `${AUTH_BASE_URL}${API_ENDPOINTS.permissions.getAdminUserMenus}`,
    { userId },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return Array.isArray(response.data) ? response.data : [];
};

/** Replace-all save. */
export const saveAdminUserMenuPermissions = async (
  userId: number,
  permissions: MenuPermissionRow[],
  authToken: string
): Promise<string> => {
  const response = await axios.post(
    `${AUTH_BASE_URL}${API_ENDPOINTS.permissions.saveAdminUserMenus}`,
    { userId, permissions },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data;
};
