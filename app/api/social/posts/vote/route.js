import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { postId, optionIndex } = await request.json()
    if (!postId || optionIndex == null) return Response.json({ error: 'postId and optionIndex required' }, { status: 400 })

    // Fetch current poll
    const post = await prisma.socialPost.findUnique({ where: { id: postId }, select: { poll: true } })
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 })
    if (!post.poll || !Array.isArray(post.poll)) return Response.json({ error: 'No poll on this post' }, { status: 400 })

    const poll = post.poll
    if (optionIndex < 0 || optionIndex >= poll.length) return Response.json({ error: 'Invalid option' }, { status: 400 })

    // Check if user already voted
    const alreadyVotedIndex = poll.findIndex(o => Array.isArray(o.voters) && o.voters.includes(session.user.id))
    if (alreadyVotedIndex !== -1) {
      return Response.json({ poll, alreadyVoted: true, votedIndex: alreadyVotedIndex })
    }

    // Record vote + voter
    poll[optionIndex] = {
      ...poll[optionIndex],
      votes: (poll[optionIndex].votes || 0) + 1,
      voters: [...(poll[optionIndex].voters || []), session.user.id],
    }

    const updated = await prisma.socialPost.update({
      where: { id: postId },
      data: { poll },
      select: { poll: true },
    })

    return Response.json({ poll: updated.poll })
  } catch (e) {
    console.error('[POST /api/social/posts/vote]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
