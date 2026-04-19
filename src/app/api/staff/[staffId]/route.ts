import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params
  return forwardToAdminBff(request, 'GET', `/api/admin/staff/${encodeURIComponent(staffId)}`)
}