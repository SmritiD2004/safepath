import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({
        hasData: false,
        latestPre: null,
        latestPost: null,
        improvement: null,
      })
    }

    const [latestPre, latestPost, countPre, countPost] = await Promise.all([
      db.assessment.findFirst({
        where: { userId, type: 'PRE' },
        orderBy: { createdAt: 'desc' },
        select: { score: true, createdAt: true },
      }),
      db.assessment.findFirst({
        where: { userId, type: 'POST' },
        orderBy: { createdAt: 'desc' },
        select: { score: true, createdAt: true },
      }),
      db.assessment.count({ where: { userId, type: 'PRE' } }),
      db.assessment.count({ where: { userId, type: 'POST' } }),
    ])

    const improvement =
      latestPre && latestPost ? latestPost.score - latestPre.score : null

    return NextResponse.json({
      hasData: Boolean(latestPre || latestPost),
      latestPre,
      latestPost,
      improvement,
      attempts: {
        pre: countPre,
        post: countPost,
      },
    })
  } catch {
    return NextResponse.json(
      {
        hasData: false,
        latestPre: null,
        latestPost: null,
        improvement: null,
      },
      { status: 200 }
    )
  }
}
