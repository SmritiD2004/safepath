import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { orgId } = await params
  const membership = await db.orgMember.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
  })

  const allowed = ['MANAGER', 'ORG_ADMIN', 'ADMIN'] as const
  if (!membership || !allowed.includes(membership.orgRole)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
