import { Card, CardContent } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
  loading?: boolean
  className?: string
  onClick?: () => void
}

const colorClasses = {
  blue: {
    background: 'bg-blue-500',
    icon: 'text-blue-600',
    accent: 'border-blue-200',
    hover: 'hover:border-blue-300'
  },
  green: {
    background: 'bg-green-500',
    icon: 'text-green-600',
    accent: 'border-green-200',
    hover: 'hover:border-green-300'
  },
  purple: {
    background: 'bg-purple-500',
    icon: 'text-purple-600',
    accent: 'border-purple-200',
    hover: 'hover:border-purple-300'
  },
  orange: {
    background: 'bg-orange-500',
    icon: 'text-orange-600',
    accent: 'border-orange-200',
    hover: 'hover:border-orange-300'
  },
  red: {
    background: 'bg-red-500',
    icon: 'text-red-600',
    accent: 'border-red-200',
    hover: 'hover:border-red-300'
  },
  indigo: {
    background: 'bg-indigo-500',
    icon: 'text-indigo-600',
    accent: 'border-indigo-200',
    hover: 'hover:border-indigo-300'
  }
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false,
  className,
  onClick
}: StatsCardProps) {
  const colors = colorClasses[color]

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "p-6 transition-all duration-200 border-l-4 cursor-pointer",
        colors.accent,
        colors.hover,
        "hover:shadow-md transform hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span className={cn(
                  "font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
            
            {description && !trend && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-lg",
            colors.background
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton specifically for stats cards
export function StatsCardSkeleton() {
  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// Grid container for stats cards
interface StatsGridProps {
  children: React.ReactNode
  className?: string
}

export function StatsGrid({ children, className }: StatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
      className
    )}>
      {children}
    </div>
  )
}