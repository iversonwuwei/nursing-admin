import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return forwardToAdminBff(request, 'GET', `/api/admin/health/archives${request.nextUrl.search}`)
}

export async function POST(request: NextRequest) {
  return forwardToAdminBff(request, 'POST', '/api/admin/health/archives', await request.json())
}