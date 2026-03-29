'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';

interface TopBarProps {
  username: string;
  organization: string;
}

export function TopBar({ username, organization }: TopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{organization}</h2>
        <div className="topbar-breadcrumb">
          <span>欢迎回来</span>
          <span>·</span>
          <span>{username}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
          <Bell width={18} height={18} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7,
            background: 'hsl(var(--danger))',
            borderRadius: '50%',
            border: '2px solid white'
          }}/>
        </button>

        {/* User area */}
        <div className="topbar-divider"/>
        <div className="topbar-user-info">
          <p className="topbar-username">{username}</p>
          <p className="topbar-role">管理员</p>
        </div>
        <div className="topbar-avatar">{username.charAt(0).toUpperCase()}</div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>
          退出
        </button>
      </div>
    </header>
  );
}
