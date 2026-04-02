"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await signIn("credentials", { username, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push("/")
      router.refresh()
    } else {
      setError("用户名或密码错误")
    }
  }

  return (
    <div className="flex-center login-shell" style={{
      minHeight: '100svh',
      background: 'var(--color-bg)',
      position: 'relative',
      overflow: 'hidden',
      justifyContent: 'center',
    }}>
      {/* 装饰圆 */}
      <div className="login-decorations">
        <div className="login-deco-circle top-right" />
        <div className="login-deco-circle bottom-left" />
      </div>

      <div className="login-panel" style={{ position: 'relative', zIndex: 1 }}>
        {/* 登录卡片 */}
        <div className="data-card login-card">
          <div className="login-card-header">
            <div className="login-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1 className="login-card-title">
              养老院管理系统
            </h1>
            <p className="login-card-kicker">
              管理员登录
            </p>
            <p className="login-card-subtitle">
              Nursing Home Management
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">

            <div>
              <label className="form-label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="form-label">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="form-error login-form-error" aria-live="polite">
                <div className="login-form-error-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-danger)', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <div className="login-form-error-title">登录失败</div>
                  <div className="login-form-error-detail">{error}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner animate-spin" />
                  <span>登录中...</span>
                </>
              ) : '登录'}
            </button>
          </form>

          <div className="login-card-footer">
            <p className="login-card-hint">
              测试账号：admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
