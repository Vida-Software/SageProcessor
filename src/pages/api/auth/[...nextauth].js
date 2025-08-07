import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Esta es una configuración básica para NextAuth
        // En producción deberías validar contra tu base de datos
        if (credentials.username === 'admin' && credentials.password === 'admin') {
          return {
            id: 1,
            name: 'Admin User',
            email: 'admin@sage.local'
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key'
})