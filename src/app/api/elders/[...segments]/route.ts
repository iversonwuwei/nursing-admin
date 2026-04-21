import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    segments: string[]
  }>
}

function resolveReadPath(segments: string[], search: string): string | null {
  if (segments.length === 1 && segments[0] === 'face-enrollment') {
    return `/api/admin/elders/face-enrollment${search}`
  }

  if (segments.length === 1) {
    return `/api/admin/elders/${encodeURIComponent(segments[0])}${search}`
  }

  if (segments.length === 2 && segments[1] === 'health-summary') {
    return `/api/admin/elders/${encodeURIComponent(segments[0])}/health-summary${search}`
  }

  return null
}

function resolveWritePath(segments: string[]): string | null {
  if (segments.length === 1 && segments[0] === 'admissions') {
    return '/api/admin/elders/admissions'
  }

  if (segments.length === 3 && segments[1] === 'face-enrollment') {
    return `/api/admin/elders/${encodeURIComponent(segments[0])}/face-enrollment/${encodeURIComponent(segments[2])}`
  }

  if (segments.length === 1) {
    return `/api/admin/elders/${encodeURIComponent(segments[0])}`
  }

  return null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolveReadPath(segments, request.nextUrl.search)

  if (!path) {
    return NextResponse.json({ message: '未知的长者详情读取路径。' }, { status: 404 })
  }

  return forwardToAdminBff(request, 'GET', path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolveWritePath(segments)

  const isAdmission = segments.length === 1 && segments[0] === 'admissions'
  const isFaceAction = segments.length === 3 && segments[1] === 'face-enrollment'
  if (!path || (!isAdmission && !isFaceAction)) {
    return NextResponse.json({ message: '未知的长者写入路径。' }, { status: 404 })
  }

  return forwardToAdminBff(request, 'POST', path, await request.json())
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolveWritePath(segments)

  if (!path || segments[0] === 'admissions') {
    return NextResponse.json({ message: '未知的长者主档更新路径。' }, { status: 404 })
  }

  return forwardToAdminBff(request, 'PUT', path, await request.json())
}