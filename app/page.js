import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import LandingPage from '../components/LandingPage'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/app')
  return <LandingPage />
}
