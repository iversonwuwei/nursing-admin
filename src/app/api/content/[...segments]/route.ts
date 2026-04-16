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
  const joined = segments.join('/')

  if (
    joined.startsWith('static-texts') ||
    joined.startsWith('option-groups') ||
    joined.startsWith('audit-logs')
  ) {
    return `/api/admin/${joined}${search}`
  }

  if (segments[0] === 'alerts') {
    if (segments.length === 1) {
      return `/api/admin/alerts${search}`
    }

    if (segments.length === 2 && segments[1] === 'summary') {
      return `/api/admin/alerts/summary${search}`
    }

    if (segments.length === 3 && segments[2] === 'actions') {
      return `/api/admin/alerts/${encodeURIComponent(segments[1])}/actions${search}`
    }
  }

  if (segments[0] === 'finance') {
    if (segments.length === 2 && segments[1] === 'summary') {
      return `/api/admin/finance/summary${search}`
    }

    if (segments.length === 2 && segments[1] === 'invoices') {
      return `/api/admin/finance/invoices${search}`
    }
  }

  if (segments[0] === 'notifications') {
    if (segments.length === 2 && segments[1] === 'summary') {
      return `/api/admin/notifications/summary${search}`
    }

    if (segments.length === 2 && segments[1] === 'queue') {
      return `/api/admin/notifications/queue${search}`
    }
  }

  return null
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return undefined
  return request.json()
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)
  if (!path) return NextResponse.json({ message: '未知的内容管理路径。' }, { status: 404 })
  return forwardToAdminBff(request, 'GET', path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)
  if (!path) return NextResponse.json({ message: '未知的内容管理路径。' }, { status: 404 })
  return forwardToAdminBff(request, 'POST', path, await readJsonBody(request))
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)
  if (!path) return NextResponse.json({ message: '未知的内容管理路径。' }, { status: 404 })
  return forwardToAdminBff(request, 'PUT', path, await readJsonBody(request))
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)
  if (!path) return NextResponse.json({ message: '未知的内容管理路径。' }, { status: 404 })
  return forwardToAdminBff(request, 'DELETE', path)
}
