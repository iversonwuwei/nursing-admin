import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    segments: string[]
  }>
}

function resolveWritePath(segments: string[]) {
  if (segments.length !== 2) {
    return null
  }

  const [assessmentId, action] = segments

  if (action === 'decision') {
    return `/api/admin/assessments/${encodeURIComponent(assessmentId)}/decision`
  }

  if (action === 'activate') {
    return `/api/admin/assessments/${encodeURIComponent(assessmentId)}/activate`
  }

  return null
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolveWritePath(segments)

  if (!path) {
    return NextResponse.json({ message: '未知的个案评定写入路径。' }, { status: 404 })
  }

  const body = segments[1] === 'activate' ? undefined : await request.json()
  return forwardToAdminBff(request, 'PUT', path, body)
}