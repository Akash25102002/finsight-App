import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string
  change?: string
  changePositive?: boolean
  icon: LucideIcon
  iconColor?: string
}

export function StatsCard({ title, value, change, changePositive, icon: Icon, iconColor }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={cn('text-xs mt-1', changePositive ? 'text-green-500' : 'text-red-500')}>
                {change}
              </p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-lg bg-muted', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
