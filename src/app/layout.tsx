import { AppWrapper } from "@/components/layout/app-wrapper"
import { SessionProvider } from "@/components/providers/session-provider"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "养老院管理系统 v2",
  description: "养老院综合管理平台 - 连锁机构智慧管理系统",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          <AppWrapper>{children}</AppWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
