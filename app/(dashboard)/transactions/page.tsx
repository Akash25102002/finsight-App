'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import TransactionForm from '@/components/transactions/TransactionForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Pencil, Download, Plus } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Papa from 'papaparse'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editTx, setEditTx] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const now = new Date()

  async function load() {
    const params = new URLSearchParams({
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
      limit: '100',
    })
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/transactions?${params}`)
    const data = await res.json()
    setTransactions(data.transactions || [])
  }

  useEffect(() => { load() }, [typeFilter])

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); load() }
    else toast.error('Failed to delete')
  }

  function exportCSV() {
    const csv = Papa.unparse(
      transactions.map((t) => ({
        Date: format(new Date(t.date), 'dd/MM/yyyy'),
        Title: t.title,
        Type: t.type,
        Category: t.categoryId?.name || '',
        Amount: t.amount,
        Note: t.note || '',
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finsight-${format(now, 'MMM-yyyy')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = transactions.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{format(now, 'MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
              <TransactionForm onSuccess={() => { setOpen(false); load() }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          {[{ v: '', l: 'All' }, { v: 'income', l: 'Income' }, { v: 'expense', l: 'Expenses' }].map(({ v, l }) => (
            <Button key={v} variant={typeFilter === v ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(v)}>
              {l}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No transactions found</p>
          ) : (
            <div>
              {filtered.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{tx.categoryId?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.categoryId?.name} · {format(new Date(tx.date), 'dd MMM yyyy')}</p>
                      {tx.note && <p className="text-xs text-muted-foreground italic">{tx.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditTx(tx); setEditOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTransaction(tx._id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
          <TransactionForm transaction={editTx} onSuccess={() => { setEditOpen(false); load() }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
