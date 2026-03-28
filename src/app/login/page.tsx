"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("用户名或密码错误");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#7c3bed' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#05bed6' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: '#7c3bed' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#1b1d23' }}>养老院管理系统</h1>
          <p className="text-sm mt-1" style={{ color: '#676f7e' }}>Nursing Home Management</p>
        </div>

        {/* Card */}
        <div className="nh-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#676f7e' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#e2e4e9',
                  color: '#1b1d23',
                  '--tw-ring-color': '#7c3bed',
                } as React.CSSProperties}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#676f7e' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#e2e4e9',
                  color: '#1b1d23',
                  '--tw-ring-color': '#7c3bed',
                } as React.CSSProperties}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: '#fcf2f2', color: '#df3a3a' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#7c3bed' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "登录"}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-5 pt-4 border-t"
            style={{ borderColor: '#e2e4e9' }}>
            <p className="text-xs text-center" style={{ color: '#676f7e' }}>
              测试账号: <code className="font-mono font-semibold" style={{ color: '#7c3bed' }}>admin</code>
              {" / "}
              <code className="font-mono font-semibold" style={{ color: '#7c3bed' }}>admin123</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#676f7e' }}>
          © 2024 Nursing Admin v2.0
        </p>
      </div>
    </div>
  );
}
