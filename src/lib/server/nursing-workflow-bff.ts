import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { resolveServerAccessContext } from '@/lib/server/platform-auth'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'

const ADMIN_API_URL = process.env.ADMIN_API_URL ?? process.env.ADMIN_BFF_URL ?? 'http://localhost:5200'

type WorkflowMethod = 'GET' | 'POST' | 'PUT'
type JwtRequest = NonNullable<Parameters<typeof getToken>[0]>['req']

type SessionUser = {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  tenantId?: string | null
}

function buildUnavailableResponse(detail: string) {
  return new Response(JSON.stringify({
    title: '护理工作流统一入口代理不可用',
    detail,
    message: detail,
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function forwardWorkflowRequest(request: Request, method: WorkflowMethod, path: string, body?: unknown) {
  const session = await getServerSession(authOptions)
  const user = (session?.user ?? null) as SessionUser | null

  if (!user) {
    return new Response(JSON.stringify({ message: '未登录' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const jwt = await getToken({ req: request as JwtRequest })
    const accessContext = await resolveServerAccessContext(user, typeof jwt?.platformAccessToken === 'string' ? jwt.platformAccessToken : null)
    const response = await fetch(`${ADMIN_API_URL}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${accessContext.accessToken}`,
        'Content-Type': 'application/json',
        'X-Tenant-Id': accessContext.tenantId,
        'X-Correlation-Id': crypto.randomUUID(),
      },
      body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body),
    })

    const text = await response.text()
    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (error) {
    const detail = error instanceof Error
      ? `本地 identity 或护理工作流 Gateway 当前不可达：${error.message}`
      : '本地 identity 或护理工作流 Gateway 当前不可达。'
    console.warn(`[nursing-workflow-api] ${detail}`)
    return buildUnavailableResponse(detail)
  }
}