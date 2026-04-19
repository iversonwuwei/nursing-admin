import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return forwardToAdminBff(request, 'GET', `/api/admin/organizations${request.nextUrl.search}`)
}

export async function POST(request: NextRequest) {
  return forwardToAdminBff(request, 'POST', '/api/admin/organizations', await request.json())
}