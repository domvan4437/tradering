import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import CommodityScreener from '../../components/CommodityScreener'

export default async function AppPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <CommodityScreener />
}
