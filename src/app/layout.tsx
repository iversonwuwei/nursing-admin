import type { Metadata } from "next"
import { Inter, Fira_Code } from "next/font/google"
import "./globals.css"
import { AppWrapper } from "@/components/layout/app-wrapper"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

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
    <html lang="zh-CN" className={`${inter.variable} ${firaCode.variable}`}>
      <body>
        <SessionProvider>
          <AppWrapper>{children}</AppWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
