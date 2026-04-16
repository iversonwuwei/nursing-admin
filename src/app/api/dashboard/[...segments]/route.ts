import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    segments: string[]
  }>
}

function resolvePath(segments: string[], search: string): string | null {
  if (segments.length === 1 && segments[0] === 'overview') {
    return `/api/admin/dashboard/overview${search}`
  }

  return null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)

  if (!path) {
    return NextResponse.json({ message: '未知的 dashboard 读取路径。' }, { status: 404 })
  }

  return forwardToAdminBff(request, 'GET', path)
}