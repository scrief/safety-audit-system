'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useNavigationManager } from '@/hooks/useNavigationManager';

interface NavItem {
  name: string;
  href: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/' },
  { name: 'Forms', href: '/forms' },
  { name: 'Audits', href: '/audits' },
  { name: 'Clients', href: '/clients' },
  { name: 'Reports', href: '/reports' },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { handleFormsNavigation } = useNavigationManager();

  const isActive = (item: NavItem) => {
    if (item.name === 'Forms') {
      // Consider any forms-related path as active for the Forms link
      return pathname === '/forms' || pathname.startsWith('/forms/') || 
             (pathname === '/forms' && searchParams.has('action'));
    }
    return pathname === item.href;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="h-full px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={item.name === 'Forms' ? handleFormsNavigation : undefined}
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${active 
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}