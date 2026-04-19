
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';

export async function GET(req, { params }) {
  const template = await prisma.screenerTemplate.findUnique({
    where: { id: params.id },
    include: {
      signals: { orderBy: { sortOrder: 'asc' } },
      user: { select: { name: true, email: true, consistency: true } },
    },
  });
  if (!template) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ template });
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, assetClass, traderStyle, minScore, isPublic, isPinned, signals } = body;

  const existing = await prisma.screenerTemplate.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete old signals and recreate
  await prisma.screenerSignal.deleteMany({ where: { templateId: params.id } });

  const template = await prisma.screenerTemplate.update({
    where: { id: params.id },
    data: {
      name: name?.trim() || existing.name,
      description: description?.trim() || null,
      assetClass: assetClass || null,
      traderStyle: traderStyle || null,
      minScore: minScore !== undefined ? parseFloat(minScore) : existing.minScore,
      isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
      isPinned: isPinned !== undefined ? isPinned : existing.isPinned,
      updatedAt: new Date(),
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
    include: { signals: { orderBy: { sortOrder: 'asc' } } },
  });

  return Response.json({ template });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.screenerTemplate.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.screenerTemplate.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
