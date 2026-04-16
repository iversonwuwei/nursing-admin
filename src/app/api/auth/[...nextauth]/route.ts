import { authenticateAdminUser } from "@/lib/server/platform-auth"
import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
        tenantId: { label: "租户", type: "text" },
      },
      async authorize(credentials) {
        return authenticateAdminUser(credentials ? {
          username: credentials.username,
          password: credentials.password,
          tenantId: credentials.tenantId,
        } : null)
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24小时
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as typeof user & {
          role?: string
          tenantId?: string
          tenantName?: string
          tenantPlan?: string
          enabledModules?: string[]
          enabledFeatures?: string[]
          authSource?: "demo" | "platform"
          accessToken?: string
          scopes?: string[]
        }

        token.role = typeof authenticatedUser.role === "string" ? authenticatedUser.role : token.role
        token.tenantId = typeof authenticatedUser.tenantId === "string" ? authenticatedUser.tenantId : token.tenantId
        token.tenantName = typeof authenticatedUser.tenantName === "string" ? authenticatedUser.tenantName : token.tenantName
        token.tenantPlan = typeof authenticatedUser.tenantPlan === "string" ? authenticatedUser.tenantPlan : token.tenantPlan
        token.enabledModules = Array.isArray(authenticatedUser.enabledModules) ? authenticatedUser.enabledModules : token.enabledModules
        token.enabledFeatures = Array.isArray(authenticatedUser.enabledFeatures) ? authenticatedUser.enabledFeatures : token.enabledFeatures
        token.authSource = authenticatedUser.authSource === "platform" ? "platform" : (authenticatedUser.authSource === "demo" ? "demo" : token.authSource)
        token.platformAccessToken = typeof authenticatedUser.accessToken === "string" ? authenticatedUser.accessToken : token.platformAccessToken
        token.scopes = Array.isArray(authenticatedUser.scopes) ? authenticatedUser.scopes : token.scopes
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, {
          role: typeof token.role === "string" ? token.role : undefined,
          tenantId: typeof token.tenantId === "string" ? token.tenantId : undefined,
          tenantName: typeof token.tenantName === "string" ? token.tenantName : undefined,
          tenantPlan: typeof token.tenantPlan === "string" ? token.tenantPlan : undefined,
          enabledModules: Array.isArray(token.enabledModules) ? token.enabledModules : undefined,
          enabledFeatures: Array.isArray(token.enabledFeatures) ? token.enabledFeatures : undefined,
          authSource: token.authSource === "platform" ? "platform" : "demo",
        })
      }

      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
