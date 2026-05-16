// app/api/transactions/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Transaction from '@/models/Transaction'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string(),
  date: z.string(),
  note: z.string().max(500).optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!session || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    await connectDB()

    const filter: Record<string, unknown> = { userId }

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      filter.date = { $gte: start, $lte: end }
    }

    if (type) filter.type = type

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('categoryId', 'name icon color')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ])

    return NextResponse.json({ transactions, total, page, limit })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('❌ GET /api/transactions:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!session || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('📥 POST /api/transactions body:', JSON.stringify(body))

    const data = schema.parse(body)

    await connectDB()
    const tx = await Transaction.create({ ...data, userId })
    await tx.populate('categoryId', 'name icon color')

    return NextResponse.json(tx, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      console.error('❌ Zod validation:', err.errors)
      return NextResponse.json({ error: err.errors[0].message }, { status: 422 })
    }
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('❌ POST /api/transactions:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
