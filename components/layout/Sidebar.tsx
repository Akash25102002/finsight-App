'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, ArrowLeftRight, PieChart,
  Wallet, LogOut, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border px-4 py-6 gap-6">
      <div className="flex items-center gap-2 px-2">
        <TrendingUp className="text-primary w-6 h-6" />
        <span className="text-xl font-bold tracking-tight">FinSight</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border pt-4 flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={session?.user?.image || ''} />
          <AvatarFallback>{session?.user?.name?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Assignment footer */}
      <div className="text-xs text-muted-foreground px-2 space-y-0.5 border-t border-border pt-3">
        <p className="font-medium text-foreground">Your Name Here</p>
        <div className="flex gap-2">
          <a href="https://github.com/yourusername" target="_blank" rel="noopener" className="hover:text-primary underline">GitHub</a>
          <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener" className="hover:text-primary underline">LinkedIn</a>
        </div>
      </div>
    </aside>
  )
}
