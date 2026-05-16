import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Transaction from '@/models/Transaction'
import mongoose from 'mongoose'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  await connectDB()

  const userId = new mongoose.Types.ObjectId(session.user.id)

  const monthly = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ])

  const now = new Date()
  const categoryBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        },
      },
    },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        name: '$category.name',
        color: '$category.color',
        icon: '$category.icon',
        total: 1,
      },
    },
    { $sort: { total: -1 } },
  ])

  return NextResponse.json({ monthly, categoryBreakdown })
}
