import { forwardToAdminBff, forwardToService } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NANI_BFF_URL = process.env.NANI_BFF_URL ?? 'http://localhost:5213'
const FAMILY_BFF_URL = process.env.FAMILY_BFF_URL ?? 'http://localhost:5274'

type RouteContext = {
  params: Promise<{
    segments: string[]
  }>
}

const POST_ROUTES = new Set([
  'dashboard-insights',
  'health-risk',
  'alert-suggestion',
  'task-priority',
  'admission-assessment',
  'ops-report',
  'financial-insights',
  'device-insights',
  'incident-analysis',
  'resource-insights',
  'chat',
  'elder-detail-action',
])

type ResolvedRoute = {
  service: 'admin' | 'nani' | 'family'
  path: string
}

function resolvePath(segments: string[], search: string): ResolvedRoute | null {
  const joined = segments.join('/')

  if (POST_ROUTES.has(joined)) {
    return { service: 'admin', path: `/api/admin/ai/${joined}` }
  }

  if (segments[0] === 'staff' && segments.length === 2 && ['shift-summary', 'care-copilot', 'handover-draft', 'escalation-draft'].includes(segments[1])) {
    return { service: 'nani', path: `/api/nani/ai/${segments[1]}` }
  }

  if (segments[0] === 'family' && segments.length === 2 && ['today-summary', 'health-explain', 'visit-assistant', 'visit-risk', 'chat'].includes(segments[1])) {
    return { service: 'family', path: `/api/family/ai/${segments[1]}${search}` }
  }

  if (joined === 'rules' || joined === 'models/status' || joined.startsWith('audit-logs')) {
    return { service: 'admin', path: `/api/admin/ai/${joined}${search}` }
  }

  if (segments.length === 3 && segments[0] === 'rules' && segments[2] === 'toggle') {
    return { service: 'admin', path: `/api/admin/ai/rules/${segments[1]}/toggle` }
  }

  return null
}

async function forwardResolvedRoute(request: Request, method: 'GET' | 'POST' | 'PATCH', resolved: ResolvedRoute, body?: unknown) {
  if (resolved.service === 'admin') {
    return forwardToAdminBff(request, method, resolved.path, body)
  }

  if (resolved.service === 'nani') {
    return forwardToService(request, method, NANI_BFF_URL, resolved.path, body)
  }

  return forwardToService(request, method, FAMILY_BFF_URL, resolved.path, body)
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
  const resolved = resolvePath(segments, request.nextUrl.search)

  if (!resolved) {
    return NextResponse.json({ message: '未知的 AI 读取路径。' }, { status: 404 })
  }

  return forwardResolvedRoute(request, 'GET', resolved)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const resolved = resolvePath(segments, request.nextUrl.search)

  if (!resolved) {
    return NextResponse.json({ message: '未知的 AI 写入路径。' }, { status: 404 })
  }

  return forwardResolvedRoute(request, 'POST', resolved, await readJsonBody(request))
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { segments } = await context.params
  const resolved = resolvePath(segments, request.nextUrl.search)

  if (!resolved) {
    return NextResponse.json({ message: '未知的 AI 更新路径。' }, { status: 404 })
  }

  return forwardResolvedRoute(request, 'PATCH', resolved, await readJsonBody(request))
}