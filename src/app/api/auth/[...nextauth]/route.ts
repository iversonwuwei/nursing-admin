import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        // 演示环境 - 简单验证
        if (
          credentials?.username === "admin" &&
          credentials?.password === "admin123"
        ) {
          return {
            id: "1",
            name: "管理员",
            email: "admin@nursing.com",
            role: "super_admin",
          }
        }
        if (
          credentials?.username === "manager" &&
          credentials?.password === "manager123"
        ) {
          return {
            id: "2",
            name: "机构管理员",
            email: "manager@nursing.com",
            role: "org_admin",
          }
        }
        return null
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
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
