'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const now = new Date()
  const [form, setForm] = useState({
    categoryId: '',
    limit: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })

  async function load() {
    const [bRes, cRes] = await Promise.all([
      fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
      fetch('/api/categories'),
    ])
    setBudgets(await bRes.json())
    const cats = await cRes.json()
    setCategories(cats.filter((c: any) => c.type === 'expense'))
  }

  useEffect(() => { load() }, [])

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId || !form.limit) return toast.error('Fill all fields')
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, limit: parseFloat(form.limit) }),
    })
    if (!res.ok) return toast.error('Failed to save budget')
    toast.success('Budget saved!')
    setOpen(false)
    setForm({ categoryId: '', limit: '', month: now.getMonth() + 1, year: now.getFullYear() })
    load()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">{format(now, 'MMMM yyyy')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Set Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Monthly Budget</DialogTitle></DialogHeader>
            <form onSubmit={saveBudget} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select expense category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Limit (₹)</Label>
                <Input type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="e.g. 5000" required className="mt-1" />
              </div>
              <Button type="submit" className="w-full">Save Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className={cn('text-xl font-bold', totalSpent > totalBudget ? 'text-destructive' : 'text-foreground')}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground text-sm">No budgets set for this month.</p>
              <p className="text-muted-foreground text-xs mt-1">Click "Set Budget" to start tracking your spending limits.</p>
            </CardContent>
          </Card>
        ) : (
          budgets.map((b) => {
            const pct = Math.min(b.percentage || 0, 100)
            const over = (b.percentage || 0) > 100
            const warn = (b.percentage || 0) > 80 && !over
            return (
              <Card key={b._id} className={cn(over && 'border-destructive')}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span>{b.categoryId?.icon}</span>
                      {b.categoryId?.name}
                    </CardTitle>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', over ? 'bg-destructive/10 text-destructive' : warn ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground')}>
                      {over ? '🚨 Over budget' : warn ? `⚠️ ${b.percentage}%` : `${b.percentage || 0}%`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', over ? 'bg-destructive' : warn ? 'bg-amber-500' : 'bg-primary')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spent: <span className="font-medium text-foreground">₹{(b.spent || 0).toLocaleString('en-IN')}</span></span>
                    <span>Limit: <span className="font-medium text-foreground">₹{b.limit.toLocaleString('en-IN')}</span></span>
                  </div>
                  {over && (
                    <p className="text-xs text-destructive mt-1.5">
                      Over by ₹{((b.spent || 0) - b.limit).toLocaleString('en-IN')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
