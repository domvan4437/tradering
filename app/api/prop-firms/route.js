
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

// Partner prop firms (placeholders — replace with real partners)
export const PROP_FIRMS = [
  {
    slug: 'ftmo',
    name: 'FTMO',
    description: 'Up to $200,000 in funding. One of the most respected prop firms globally.',
    minWinRate: 0.55,
    minTrades: 50,
    minAccountAge: 90,
    fundingLevels: ['$10K', '$25K', '$50K', '$100K', '$200K'],
    url: 'https://ftmo.com',
    logo: 'FTMO',
  },
  {
    slug: 'myforexfunds',
    name: 'My Forex Funds',
    description: 'Fast-track evaluation for traders with verified track records.',
    minWinRate: 0.50,
    minTrades: 30,
    minAccountAge: 60,
    fundingLevels: ['$10K', '$50K', '$100K', '$200K'],
    url: 'https://myforexfunds.com',
    logo: 'MFF',
  },
  {
    slug: 'topstep',
    name: 'Topstep',
    description: 'Specializes in futures traders. CME Group partner.',
    minWinRate: 0.50,
    minTrades: 20,
    minAccountAge: 30,
    fundingLevels: ['$50K', '$100K', '$150K'],
    url: 'https://topstep.com',
    logo: 'TS',
  },
];

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      consistency: true,
      propFirmReferrals: true,
    },
  });

  const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const cons = user.consistency;

  // Check eligibility for each firm
  const firms = PROP_FIRMS.map(firm => {
    const eligible =
      (cons?.winRate || 0) >= firm.minWinRate &&
      (cons?.totalTrades || 0) >= firm.minTrades &&
      accountAgeDays >= firm.minAccountAge;

    const existing = user.propFirmReferrals?.find(r => r.firmSlug === firm.slug);

    return {
      ...firm,
      eligible,
      referred: !!existing,
      referralStatus: existing?.status || null,
      requirements: {
        winRate:    { required: firm.minWinRate,    current: cons?.winRate || 0,         met: (cons?.winRate || 0) >= firm.minWinRate },
        trades:     { required: firm.minTrades,     current: cons?.totalTrades || 0,     met: (cons?.totalTrades || 0) >= firm.minTrades },
        accountAge: { required: firm.minAccountAge, current: Math.floor(accountAgeDays), met: accountAgeDays >= firm.minAccountAge },
      },
    };
  });

  return Response.json({ firms, userStats: cons });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { firmSlug } = await req.json();
  const firm = PROP_FIRMS.find(f => f.slug === firmSlug);
  if (!firm) return Response.json({ error: 'Firm not found' }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { consistency: true },
  });

  const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const cons = user.consistency;

  const eligible =
    (cons?.winRate || 0) >= firm.minWinRate &&
    (cons?.totalTrades || 0) >= firm.minTrades &&
    accountAgeDays >= firm.minAccountAge;

  if (!eligible) return Response.json({ error: 'You do not meet the requirements for this firm yet' }, { status: 400 });

  // Create referral record
  const referral = await prisma.propFirmReferral.upsert({
    where: { id: `${session.user.id}-${firmSlug}` },
    create: {
      id: `${session.user.id}-${firmSlug}`,
      userId: session.user.id,
      firmName: firm.name,
      firmSlug: firm.slug,
      status: 'pending',
    },
    update: { updatedAt: new Date() },
  }).catch(async () => {
    return prisma.propFirmReferral.create({
      data: {
        userId: session.user.id,
        firmName: firm.name,
        firmSlug: firm.slug,
        status: 'pending',
      },
    });
  });

  // Mark user as referred
  await prisma.user.update({
    where: { id: session.user.id },
    data: { propFirmInterest: true, propFirmReferredAt: new Date() },
  });

  return Response.json({ success: true, referral, firm });
}
