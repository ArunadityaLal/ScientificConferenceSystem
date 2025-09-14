import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { query } from '@/lib/database/connection'

export async function POST(req: NextRequest) {
  try {
    // 1. Ensure user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate message
    const { message } = await req.json()
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // 3. Insert into feedback table
    await query(
      `INSERT INTO feedback (user_id, message, email, name)
       VALUES ($1, $2, $3, $4)`,
      [
        session.user.id,
        message,
        session.user.email ?? null,
        session.user.name ?? null
      ]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('❌ Feedback API error:', e)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
