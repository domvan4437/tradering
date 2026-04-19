
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'mine'; // mine | community

  if (mode === 'community') {
    const templates = await prisma.screenerTemplate.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { name: true, email: true, consistency: true } },
        signals: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { runs: true } },
      },
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
    });
    return Response.json({ templates });
  }

  const templates = await prisma.screenerTemplate.findMany({
    where: { userId: session.user.id },
    include: {
      signals: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { runs: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  });

  return Response.json({ templates });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, assetClass, traderStyle, minScore, isPublic, signals, forkedFromId } = body;

  if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 });

  const template = await prisma.screenerTemplate.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      assetClass: assetClass || null,
      traderStyle: traderStyle || null,
      minScore: minScore ? parseFloat(minScore) : 60,
      isPublic: isPublic || false,
      forkedFromId: forkedFromId || null,
      signals: signals?.length ? {
        create: signals.map((s, idx) => ({
          sortOrder: idx,
          dataSource: s.dataSource || 'custom',
          metric: s.metric,
          operator: s.operator,
          valueA: parseFloat(s.valueA),
          valueB: s.valueB !== undefined && s.valueB !== '' ? parseFloat(s.valueB) : null,
          unit: s.unit || null,
          weight: parseInt(s.weight) || 1,
          isRequired: s.isRequired || false,
          notes: s.notes || null,
        }))
      } : undefined,
    },
    include: { signals: true },
  });

  // If forked, increment fork count on original
  if (forkedFromId) {
    await prisma.screenerTemplate.update({
      where: { id: forkedFromId },
      data: { forkCount: { increment: 1 } },
    }).catch(() => {});
  }

  return Response.json({ template });
}
