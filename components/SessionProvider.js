'use client'
import { SessionProvider as NextAuthProvider } from 'next-auth/react'
import ThemeProvider from './ThemeProvider'

export default function SessionProvider({ children, session }) {
  return (
    <NextAuthProvider session={session}>
      <ThemeProvider>{children}</ThemeProvider>
    </NextAuthProvider>
  )
}
