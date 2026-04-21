import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ALLOWED_ROOT_SEGMENTS = new Set(['vitals'])

type RouteContext = {
  params: Promise<{
    segments: string[]
  }>
}

function resolvePath(segments: string[], search: string) {
  if (segments.length === 0 || !ALLOWED_ROOT_SEGMENTS.has(segments[0])) {
    return null
  }

  return `/api/admin/${segments.join('/')}${search}`
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)
  if (!path) {
    return NextResponse.json({ message: '未知的体征代理路径。' }, { status: 404 })
  }
  return forwardToAdminBff(request, 'GET', path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)
  if (!path) {
    return NextResponse.json({ message: '未知的体征代理路径。' }, { status: 404 })
  }
  return forwardToAdminBff(request, 'POST', path)
}
