"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, User, AlertCircle, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      username: formData.username,
      password: formData.password,
      redirect: false,
    })

    if (result?.error) {
      setError("用户名或密码错误，请重试")
      setLoading(false)
    } else {
      document.cookie = 'isLoggedIn=true; path=/; max-age=86400'
      router.push("/")
      router.refresh()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Warm background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">养老院管理系统</h1>
              <p className="text-white/70 text-sm">连锁养老机构智慧管理平台</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight">
              温暖守护
              <br />
              <span className="text-white/80">让养老更有尊严</span>
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              整合老人健康档案、智能设备监控、跨机构协同管理，打造专业而有温度的养老服务体系。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4">
            {[
              { value: "24h", label: "健康监测" },
              { value: "100+", label: "机构接入" },
              { value: "99.9%", label: "系统稳定" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-bold text-white">{item.value}</div>
                <div className="text-white/60 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-sm">
          © 2026 养老院管理系统 v2.0
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg-primary">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-foreground">养老院管理系统</h1>
                <p className="text-sm text-muted-foreground">v2.0</p>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">欢迎回来</h2>
            <p className="text-muted-foreground mt-2">请登录您的账户以继续</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="username">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="请输入用户名"
                  className="input pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码"
                  className="input pl-11"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
                />
                <span className="text-sm text-muted-foreground">记住我</span>
              </label>
              <button type="button" className="text-sm text-primary hover:text-primary-600 hover:underline font-medium">
                忘记密码？
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "btn-press w-full h-12 rounded-xl font-semibold text-base",
                "bg-gradient-to-r from-primary-500 to-primary-600",
                "text-white shadow-lg shadow-primary/25",
                "hover:from-primary-600 hover:to-primary-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 transition-all duration-200"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5" fill="white" />
                  <span>登录</span>
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="text-center p-4 rounded-xl bg-muted/60 border border-border">
            <p className="text-sm text-muted-foreground">
              演示账号:{" "}
              <code className="bg-card px-2 py-0.5 rounded text-xs font-mono text-primary font-semibold">admin</code>
              {" / "}
              <code className="bg-card px-2 py-0.5 rounded text-xs font-mono text-primary font-semibold">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
