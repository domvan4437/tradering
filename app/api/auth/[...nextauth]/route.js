import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = 'https://mdddbfrtqnpyathtgvbv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGRiZnJ0cW5weWF0aHRndmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NDY1MCwiZXhwIjoyMDkxMjYwNjUwfQ.WNs2RHuG9N7Z9acsimnkscgWSRUcJKfrKmCTecjYk6s'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(credentials.email.toLowerCase())}&select=id,email,name,password,plan`,
          {
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
            }
          }
        )
        const users = await res.json()
        if (!users || users.length === 0) return null
        
        const user = users[0]
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        
        return { id: user.id, email: user.email, name: user.name, plan: user.plan }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = user.plan
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.plan = token.plan
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
