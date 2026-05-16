'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

interface Category {
  _id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
}

interface Transaction {
  _id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string | { _id: string; name: string; icon: string }
  date: string
  note?: string
}

interface TransactionFormProps {
  onSuccess: () => void
  transaction?: Transaction
}

export default function TransactionForm({ onSuccess, transaction }: TransactionFormProps) {
  const isEdit = !!transaction

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Resolve categoryId whether it's a string or populated object
  const resolvedCategoryId =
    typeof transaction?.categoryId === 'object'
      ? transaction.categoryId._id
      : transaction?.categoryId ?? ''

  const [form, setForm] = useState({
    title: transaction?.title ?? '',
    amount: transaction?.amount?.toString() ?? '',
    type: (transaction?.type ?? 'expense') as 'income' | 'expense',
    categoryId: resolvedCategoryId,
    date: transaction?.date
      ? new Date(transaction.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    note: transaction?.note ?? '',
  })

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('❌ Failed to load categories:', err)
        setCategories([])
      })
  }, [])

  // Filter categories by selected type
  const filteredCategories = categories.filter((c) => c.type === form.type)

  function set(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Reset category when type changes
      ...(field === 'type' ? { categoryId: '' } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return toast.error('Enter a valid amount')
    if (!form.categoryId) return toast.error('Select a category')
    if (!form.date) return toast.error('Date is required')

    setLoading(true)
    try {
      const url = isEdit
        ? `/api/transactions/${transaction._id}`
        : '/api/transactions'
      const method = isEdit ? 'PUT' : 'POST'

      const payload = {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        type: form.type,
        categoryId: form.categoryId,  // ✅ matches your Zod schema
        date: form.date,
        note: form.note.trim() || undefined,
      }

      console.log('Submitting:', payload)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong')
        return
      }

      toast.success(isEdit ? 'Transaction updated!' : 'Transaction added!')
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Grocery shopping"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
        />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => set('type', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">💰 Income</SelectItem>
            <SelectItem value="expense">💸 Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <Label>Category</Label>
        <Select
          value={form.categoryId}
          onValueChange={(v) => set('categoryId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.length === 0 ? (
              <SelectItem value="_none" disabled>
                No categories for this type
              </SelectItem>
            ) : (
              filteredCategories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div className="space-y-1">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
        />
      </div>

      {/* Note */}
      <div className="space-y-1">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          placeholder="Add a note..."
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? isEdit ? 'Updating...' : 'Adding...'
          : isEdit ? 'Update Transaction' : 'Add Transaction'}
      </Button>
    </form>
  )
}
