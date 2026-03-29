'use client';

import { BellIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': '首页',
  '/elderly': '老人管理',
  '/organizations': '机构管理',
  '/devices': '设备管理',
  '/health': '健康监测',
  '/analytics': '数据分析',
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? '智慧养老';

  return (
    <header className="main-header">
      <div className="header-left">
        <span className="header-page-title">{title}</span>
      </div>

      <div className="header-right">
        {/* Search */}
        <div className="header-search">
          <span className="header-search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input type="text" placeholder="搜索老人、设备、机构..." />
        </div>

        {/* Notifications */}
        <button className="header-icon-btn" title="通知">
          <BellIcon size={18} />
          <span className="header-notif-dot" />
        </button>

        <div className="header-divider" />

        {/* User avatar */}
        <div className="header-avatar" title="管理员">管</div>
      </div>
    </header>
  );
}
