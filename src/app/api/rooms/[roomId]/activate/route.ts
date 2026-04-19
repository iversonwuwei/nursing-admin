import { forwardToAdminBff } from '@/lib/server/admin-bff-client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  return forwardToAdminBff(request, 'POST', `/api/admin/rooms/${encodeURIComponent(roomId)}/activate`, await request.json())
}