'use client';

import { useRouter } from 'next/navigation';

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
        {/* 通知 */}
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7,
            background: 'var(--danger)',
            borderRadius: '50%',
            border: '2px solid white'
          }}/>
        </button>

        {/* 用户区 */}
        <div className="topbar-divider"/>
        <div className="topbar-user-info">
          <p className="topbar-username">{username}</p>
          <p className="topbar-role">管理员</p>
        </div>
        <div className="topbar-avatar">{username.charAt(0).toUpperCase()}</div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          退出
        </button>
      </div>
    </header>
  );
}
