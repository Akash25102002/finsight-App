import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Transaction from '@/models/Transaction'
import { groq } from '@/lib/groq'
import mongoose from 'mongoose'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const transactions = await Transaction.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
    date: { $gte: start, $lte: end },
  })
    .populate('categoryId', 'name')
    .lean()

  if (transactions.length === 0) {
    return NextResponse.json({
      insight:
        "You haven't added any transactions this month yet. Start by adding your income and expenses to get personalized AI insights!",
    })
  }

  const summary = transactions.reduce((acc: any, tx) => {
    const cat = (tx.categoryId as any)?.name || 'Other'
    if (!acc[cat]) acc[cat] = { income: 0, expense: 0 }
    acc[cat][tx.type] += tx.amount
    return acc
  }, {})

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const prompt = `You are a friendly personal finance advisor for an Indian user. Based on this month's financial data (in Indian Rupees):

Total Income: ₹${totalIncome.toLocaleString('en-IN')}
Total Expenses: ₹${totalExpense.toLocaleString('en-IN')}
Net Savings: ₹${(totalIncome - totalExpense).toLocaleString('en-IN')}
Savings Rate: ${totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%

Category breakdown:
${Object.entries(summary)
  .map(([cat, data]: any) => `- ${cat}: Income ₹${data.income.toLocaleString('en-IN')}, Expense ₹${data.expense.toLocaleString('en-IN')}`)
  .join('\n')}

Give exactly 3 specific, actionable, and friendly financial insights. Be concise (2 sentences each). Format as a numbered list. Focus on practical advice relevant to Indian context.`

  const completion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.7,
  })

  const insight =
    completion.choices[0]?.message?.content || 'Unable to generate insights at this time.'

  return NextResponse.json({ insight })
}
