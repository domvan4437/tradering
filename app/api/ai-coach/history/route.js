import { getSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(req) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return Response.json({ conversations });
}

export async function POST(req) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { conversationId, messages, title } = await req.json();

  // If conversationId provided, update existing; otherwise create new
  if (conversationId) {
    const conv = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    });
    if (!conv) return Response.json({ error: 'Not found' }, { status: 404 });

    // Delete old messages and rewrite (simplest approach for sync)
    await prisma.aIMessage.deleteMany({ where: { conversationId } });
    await prisma.aIMessage.createMany({
      data: messages.map(m => ({
        conversationId,
        role: m.role,
        content: String(m.content || '').slice(0, 20000),
      })),
    });
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { title: title || conv.title, updatedAt: new Date() },
    });

    return Response.json({ conversationId });
  } else {
    // Create new conversation
    const autoTitle = messages.find(m => m.role === 'user')?.content?.slice(0, 60) || 'New Conversation';
    const conv = await prisma.aIConversation.create({
      data: {
        userId: session.user.id,
        title: title || autoTitle,
        messages: {
          create: messages.map(m => ({
            role: m.role,
            content: String(m.content || '').slice(0, 20000),
          })),
        },
      },
    });

    return Response.json({ conversationId: conv.id });
  }
}

export async function DELETE(req) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  await prisma.aIConversation.deleteMany({
    where: { id, userId: session.user.id },
  });

  return Response.json({ ok: true });
}
