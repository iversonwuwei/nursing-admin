import { forwardWorkflowRequest } from '@/lib/server/nursing-workflow-bff'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    segments: string[]
  }>
}

function resolvePath(segments: string[], search: string) {
  if (segments.length === 1 && segments[0] === 'board') {
    return `/api/admin/nursing/workflow-board${search}`
  }

  if (segments.length === 1 && segments[0] === 'observability') {
    return `/api/admin/nursing/observability${search}`
  }

  if (segments.length === 1 && segments[0] === 'audits') {
    return `/api/admin/nursing/audits${search}`
  }

  if (segments.length === 1 && segments[0] === 'packages') {
    return '/api/admin/nursing/packages'
  }

  if (segments.length === 3 && segments[0] === 'packages' && segments[2] === 'plans') {
    return `/api/admin/nursing/packages/${segments[1]}/plans`
  }

  if (segments.length === 4 && segments[0] === 'packages' && segments[2] === 'actions') {
    return `/api/admin/nursing/packages/${segments[1]}/actions/${segments[3]}`
  }

  if (segments.length === 1 && segments[0] === 'plans') {
    return '/api/admin/nursing/plans'
  }

  if (segments.length === 4 && segments[0] === 'plans' && segments[2] === 'actions') {
    return `/api/admin/nursing/plans/${segments[1]}/actions/${segments[3]}`
  }

  if (segments.length === 3 && segments[0] === 'tasks' && (segments[2] === 'start' || segments[2] === 'complete')) {
    return `/api/admin/nursing/tasks/${segments[1]}/${segments[2]}`
  }

  if (segments.length === 3 && segments[0] === 'tasks' && segments[2] === 'note') {
    return `/api/admin/nursing/tasks/${segments[1]}/note`
  }

  return null
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined
  }

  return request.json()
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)

  if (!path) {
    return NextResponse.json({ message: '未知的护理工作流读取路径。' }, { status: 404 })
  }

  return forwardWorkflowRequest('GET', path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)

  if (!path) {
    return NextResponse.json({ message: '未知的护理工作流写入路径。' }, { status: 404 })
  }

  return forwardWorkflowRequest('POST', path, await readJsonBody(request))
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const path = resolvePath(segments, request.nextUrl.search)

  if (!path) {
    return NextResponse.json({ message: '未知的护理工作流更新路径。' }, { status: 404 })
  }

  return forwardWorkflowRequest('PUT', path, await readJsonBody(request))
}