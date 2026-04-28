'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale || 'en';

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          href: `/${locale}/admin`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          name: 'Partners',
          href: `/${locale}/admin/partners`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 min-h-screen flex flex-col transition-all duration-300 shrink-0`}>
      {/* Logo + Toggle */}
      <div className={`${collapsed ? 'p-3' : 'p-5'} flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href={`/${locale}/admin`} className="flex items-center justify-center min-w-0">
          {collapsed ? (
            <Image src="/btcllogo.png" alt="BTCL" width={48} height={40} className="rounded object-contain" />
          ) : (
            <Image src="/btcllogo.png" alt="BTCL" width={120} height={40} className="rounded object-contain" />
          )}
        </Link>
        <button
          onClick={onToggle}
          className={`p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${collapsed ? '' : 'shrink-0'}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-[#00A651] to-[#00833f] text-white shadow-lg shadow-green-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className={`shrink-0 ${isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Admin Info Card */}
      <div className={`${collapsed ? 'p-2 mx-1' : 'p-3 mx-2'} mb-3 bg-gray-800/50 rounded-lg border border-gray-700/50`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`${collapsed ? 'w-8 h-8' : 'w-9 h-9'} bg-gradient-to-br from-[#00A651] to-[#00833f] rounded-lg flex items-center justify-center shrink-0`}>
            <svg className={`${collapsed ? 'w-4 h-4' : 'w-4 h-4'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Administrator</p>
              <p className="text-[10px] text-gray-500">Super Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
