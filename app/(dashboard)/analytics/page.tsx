'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const now = new Date()

  useEffect(() => {
    fetch(`/api/analytics?year=${now.getFullYear()}`)
      .then((r) => r.json())
      .then(setAnalytics)
  }, [])

  async function getInsight() {
    setInsightLoading(true)
    try {
      const res = await fetch('/api/ai/insights')
      const data = await res.json()
      setInsight(data.insight)
    } catch {
      setInsight('Failed to load AI insights. Please check your Groq API key.')
    } finally {
      setInsightLoading(false)
    }
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthData = analytics?.monthly?.filter((m: any) => m._id.month === i + 1) || []
    const income = monthData.find((m: any) => m._id.type === 'income')?.total || 0
    const expense = monthData.find((m: any) => m._id.type === 'expense')?.total || 0
    return { month: monthNames[i], income, expense, savings: income - expense }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">{now.getFullYear()} overview</p>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Spending Insights (Powered by Groq)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={getInsight} disabled={insightLoading}>
              {insightLoading ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</>
              ) : 'Get AI Insights'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insight ? (
            <div className="text-sm whitespace-pre-line leading-relaxed">{insight}</div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Get AI Insights" to receive personalized analysis of your spending patterns powered by Llama 3 via Groq.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Income vs Expenses</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Savings trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Savings Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Spending Categories (This Month)</CardTitle></CardHeader>
        <CardContent>
          {analytics?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {analytics.categoryBreakdown.slice(0, 7).map((c: any, i: number) => {
                const max = analytics.categoryBreakdown[0].total
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg">{c.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{c.name}</span>
                        <span>₹{c.total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(c.total / max) * 100}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No expense data available for this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
