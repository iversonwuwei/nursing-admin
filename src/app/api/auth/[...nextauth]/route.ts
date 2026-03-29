import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

type DemoRole = "super_admin" | "org_admin"

type DemoUser = {
  id: string
  name: string
  email: string
  role: DemoRole
}

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
          const user: DemoUser = {
            id: "1",
            name: "管理员",
            email: "admin@nursing.com",
            role: "super_admin",
          }
          return user
        }
        if (
          credentials?.username === "manager" &&
          credentials?.password === "manager123"
        ) {
          const user: DemoUser = {
            id: "2",
            name: "机构管理员",
            email: "manager@nursing.com",
            role: "org_admin",
          }
          return user
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
      if (user && "role" in user && typeof user.role === "string") {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.role === "string") {
        Object.assign(session.user as typeof session.user & { role?: string }, {
          role: token.role,
        })
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
