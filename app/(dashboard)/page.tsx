'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import TransactionForm from '@/components/transactions/TransactionForm'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format, subMonths } from 'date-fns'

const COLORS = ['#6366f1', '#f97316', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const now = new Date()

  async function load() {
    const [txRes, anRes] = await Promise.all([
      fetch(`/api/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=6`),
      fetch(`/api/analytics?year=${now.getFullYear()}`),
    ])
    const txData = await txRes.json()
    const anData = await anRes.json()
    setTransactions(txData.transactions || [])
    setAnalytics(anData)
  }

  useEffect(() => { load() }, [])

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const monthData = analytics?.monthly?.filter((x: any) => x._id.month === m) || []
    return {
      month: format(d, 'MMM'),
      income: monthData.find((x: any) => x._id.type === 'income')?.total || 0,
      expense: monthData.find((x: any) => x._id.type === 'expense')?.total || 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{format(now, 'MMMM yyyy')} overview</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
            <TransactionForm onSuccess={() => { setOpen(false); load() }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Net Balance" value={`₹${balance.toLocaleString('en-IN')}`} icon={Wallet} changePositive={balance >= 0} />
        <StatsCard title="Income This Month" value={`₹${income.toLocaleString('en-IN')}`} icon={TrendingUp} iconColor="text-green-500" changePositive />
        <StatsCard title="Expenses This Month" value={`₹${expense.toLocaleString('en-IN')}`} icon={TrendingDown} iconColor="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Income vs Expenses (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#gIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {analytics?.categoryBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={analytics.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="total" nameKey="name">
                    {analytics.categoryBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">Add expenses to see breakdown</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href="/transactions">View all →</a>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet. Add your first one above!</p>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{tx.categoryId?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.categoryId?.name} · {format(new Date(tx.date), 'dd MMM')}</p>
                    </div>
                  </div>
                  <Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
