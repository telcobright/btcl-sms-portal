'use client';

import { Eye } from 'lucide-react';
import { useCanEdit } from '@/hooks/useCanEdit';

/**
 * Shown at the top of a page an admin holds at 'readonly'.
 *
 * Without it, the buttons simply are not there and the page looks broken or
 * half-loaded. Renders nothing at all when the account can edit, so it is safe
 * to drop into any admin page unconditionally.
 */
export default function ReadOnlyNotice({ className = '' }: { className?: string }) {
  const canEdit = useCanEdit();
  if (canEdit) return null;

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 ${className}`}
    >
      <Eye className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-[13px] leading-relaxed">
        <span className="font-semibold">Read only.</span> You can view this page but not change
        anything on it. Ask an administrator to give you Full access to this menu if you need to
        make changes.
      </p>
    </div>
  );
}
