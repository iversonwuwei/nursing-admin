import type { Metadata } from "next"
import "./globals.css"
import { AppWrapper } from "@/components/layout/app-wrapper"
import { SessionProvider } from "@/components/providers/session-provider"

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <AppWrapper>{children}</AppWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
