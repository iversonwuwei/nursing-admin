'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { username, password, redirect: false });
      if (result?.error) {
        setError('用户名或密码错误');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card animate-fadeUp">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">养</div>
          <span className="login-logo-text">智慧养老管理系统</span>
        </div>

        <h1 className="login-title">欢迎回来</h1>
        <p className="login-subtitle">请登录您的账号继续使用</p>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid #F5BFBF',
              borderRadius: 'var(--r-lg)',
              padding: '10px 14px',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="请输入密码"
              required
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="login-hint">
          <span>测试账号&nbsp;</span>
          <strong style={{ color: 'var(--primary)' }}>admin</strong>
          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>/</span>
          <strong style={{ color: 'var(--primary)' }}>admin123</strong>
        </div>
      </div>
    </div>
  );
}
