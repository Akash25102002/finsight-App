// app/api/categories/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Category from '@/models/Category'

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
  { name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#a855f7', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899', type: 'expense' },
  { name: 'Health', icon: '🏥', color: '#10b981', type: 'expense' },
  { name: 'Bills & Utilities', icon: '💡', color: '#f59e0b', type: 'expense' },
  { name: 'Rent', icon: '🏠', color: '#ef4444', type: 'expense' },
  { name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#06b6d4', type: 'income' },
  { name: 'Investment', icon: '📈', color: '#8b5cf6', type: 'income' },
]

export async function GET() {
  try {
    const session = await auth()

    // ✅ Check both session and user.id
    const userId = session?.user?.id
    if (!session || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    let categories = await Category.find({ userId }).lean()

    if (categories.length === 0) {
      const seeded = await Category.insertMany(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, userId }))
      )
      // insertMany returns docs that have toObject on mongoose docs
      categories = seeded.map((c) =>
        typeof c.toObject === 'function' ? c.toObject() : c
      )
    }

    return NextResponse.json(categories)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('❌ GET /api/categories:', message)
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
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    await connectDB()
    const category = await Category.create({ ...body, userId })
    return NextResponse.json(category, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('❌ POST /api/categories:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
