import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Budget from '@/models/Budget'
import Transaction from '@/models/Transaction'
import mongoose from 'mongoose'
import { z } from 'zod'

const schema = z.object({
  categoryId: z.string(),
  limit: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  await connectDB()

  const budgets = await Budget.find({
    userId: session.user.id,
    month,
    year,
  }).populate('categoryId', 'name icon color').lean()

  const enriched = await Promise.all(
    budgets.map(async (b) => {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)
      const result = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(session.user.id),
            categoryId: b.categoryId,
            type: 'expense',
            date: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      const spent = result[0]?.total || 0
      return { ...b, spent, percentage: Math.round((spent / b.limit) * 100) }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    await connectDB()
    const budget = await Budget.findOneAndUpdate(
      {
        userId: session.user.id,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
      },
      { $set: { ...data, userId: session.user.id } },
      { upsert: true, new: true }
    ).populate('categoryId', 'name icon color')

    return NextResponse.json(budget, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors[0].message }, { status: 422 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
