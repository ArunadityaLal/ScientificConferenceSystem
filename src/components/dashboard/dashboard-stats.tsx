'use client'

import { useState, useEffect } from 'react'
import { StatsCard, StatsGrid, StatsCardSkeleton } from './stats-card'
import {
  Users,
  Calendar,
  UserCheck,
  FileText,
  MapPin,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react'

// Mock data - replace with real API calls
const mockStatsData = {
  totalEvents: { value: 12, trend: { value: 8.2, label: 'from last month', isPositive: true } },
  totalFaculty: { value: 145, trend: { value: 12.5, label: 'from last month', isPositive: true } },
  activeSessions: { value: 28, trend: { value: -2.1, label: 'from yesterday', isPositive: false } },
  registrations: { value: 892, trend: { value: 15.3, label: 'this week', isPositive: true } },
  venues: { value: 8, trend: { value: 0, label: 'no change', isPositive: true } },
  certificates: { value: 156, trend: { value: 45.2, label: 'generated today', isPositive: true } },
  pendingApprovals: { value: 23, trend: { value: -18.7, label: 'from yesterday', isPositive: true } },
  revenue: { value: '$45,230', trend: { value: 22.1, label: 'this month', isPositive: true } }
}

interface DashboardStatsProps {
  userRole?: 'ORGANIZER' | 'EVENT_MANAGER' | 'FACULTY' | 'HALL_COORDINATOR'
  className?: string
}

export function DashboardStats({ userRole = 'ORGANIZER', className }: DashboardStatsProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(mockStatsData)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Different stats based on user role
  const getStatsForRole = () => {
    switch (userRole) {
      case 'ORGANIZER':
        return [
          {
            title: 'Total Events',
            value: stats.totalEvents.value,
            description: 'Active conferences',
            icon: Calendar,
            trend: stats.totalEvents.trend,
            color: 'blue' as const,
            onClick: () => console.log('Navigate to events')
          },
          {
            title: 'Faculty Members',
            value: stats.totalFaculty.value,
            description: 'Registered speakers',
            icon: Users,
            trend: stats.totalFaculty.trend,
            color: 'green' as const,
            onClick: () => console.log('Navigate to faculty')
          },
          {
            title: 'Total Sessions',
            value: stats.activeSessions.value,
            description: 'Scheduled sessions',
            icon: Clock,
            trend: stats.activeSessions.trend,
            color: 'purple' as const,
            onClick: () => console.log('Navigate to sessions')
          },
          {
            title: 'Registrations',
            value: stats.registrations.value,
            description: 'Delegate registrations',
            icon: UserCheck,
            trend: stats.registrations.trend,
            color: 'orange' as const,
            onClick: () => console.log('Navigate to registrations')
          }
        ]

      case 'EVENT_MANAGER':
        return [
          {
            title: 'Active Sessions',
            value: stats.activeSessions.value,
            description: 'Currently running',
            icon: Clock,
            trend: stats.activeSessions.trend,
            color: 'blue' as const
          },
          {
            title: 'Pending Approvals',
            value: stats.pendingApprovals.value,
            description: 'Requires action',
            icon: FileText,
            trend: stats.pendingApprovals.trend,
            color: 'red' as const
          },
          {
            title: 'Venues Assigned',
            value: stats.venues.value,
            description: 'Hall allocations',
            icon: MapPin,
            trend: stats.venues.trend,
            color: 'green' as const
          },
          {
            title: 'Certificates Generated',
            value: stats.certificates.value,
            description: 'This month',
            icon: Award,
            trend: stats.certificates.trend,
            color: 'purple' as const
          }
        ]

      case 'FACULTY':
        return [
          {
            title: 'My Sessions',
            value: 3,
            description: 'Assigned to me',
            icon: Calendar,
            color: 'blue' as const
          },
          {
            title: 'Presentations',
            value: 2,
            description: 'Uploaded',
            icon: FileText,
            color: 'green' as const
          },
          {
            title: 'Attendance',
            value: '95%',
            description: 'Average rate',
            icon: UserCheck,
            color: 'purple' as const
          },
          {
            title: 'Certificates',
            value: 5,
            description: 'Received',
            icon: Award,
            color: 'orange' as const
          }
        ]

      case 'HALL_COORDINATOR':
        return [
          {
            title: 'Assigned Halls',
            value: 2,
            description: 'Under management',
            icon: MapPin,
            color: 'blue' as const
          },
          {
            title: 'Today\'s Sessions',
            value: 6,
            description: 'Scheduled',
            icon: Clock,
            color: 'green' as const
          },
          {
            title: 'Attendance Marked',
            value: 145,
            description: 'Participants',
            icon: UserCheck,
            color: 'purple' as const
          },
          {
            title: 'Issues Reported',
            value: 1,
            description: 'Pending resolution',
            icon: FileText,
            color: 'red' as const
          }
        ]

      default:
        return []
    }
  }

  const statsToDisplay = getStatsForRole()

  if (loading) {
    return (
      <StatsGrid className={className}>
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </StatsGrid>
    )
  }

  return (
    <StatsGrid className={className}>
      {statsToDisplay.map((stat, index) => (
        <StatsCard
          key={index}
          {...stat}
        />
      ))}
    </StatsGrid>
  )
}

// Individual stat components for specific use cases
export function EventStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Total Events"
        value={12}
        description="Active conferences"
        icon={Calendar}
        trend={{ value: 8.2, label: 'from last month', isPositive: true }}
        color="blue"
      />
      <StatsCard
        title="Upcoming Events"
        value={5}
        description="Next 30 days"
        icon={Clock}
        color="green"
      />
      <StatsCard
        title="Completed Events"
        value={7}
        description="This year"
        icon={Award}
        trend={{ value: 40, label: 'from last year', isPositive: true }}
        color="purple"
      />
    </div>
  )
}

export function FacultyStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Faculty"
        value={145}
        description="Registered speakers"
        icon={Users}
        trend={{ value: 12.5, label: 'from last month', isPositive: true }}
        color="blue"
      />
      <StatsCard
        title="Confirmed"
        value={132}
        description="Accepted invitations"
        icon={UserCheck}
        color="green"
      />
      <StatsCard
        title="Pending"
        value={8}
        description="Awaiting response"
        icon={Clock}
        color="orange"
      />
      <StatsCard
        title="Documents"
        value={128}
        description="CVs uploaded"
        icon={FileText}
        color="purple"
      />
    </div>
  )
}

export function SessionStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Sessions"
        value={28}
        description="Scheduled"
        icon={Calendar}
        color="blue"
      />
      <StatsCard
        title="Today's Sessions"
        value={6}
        description="Active now"
        icon={Clock}
        trend={{ value: -10, label: 'from yesterday', isPositive: false }}
        color="green"
      />
      <StatsCard
        title="Completed"
        value={15}
        description="This week"
        icon={Award}
        color="purple"
      />
      <StatsCard
        title="Average Attendance"
        value="87%"
        description="All sessions"
        icon={TrendingUp}
        trend={{ value: 5.2, label: 'improvement', isPositive: true }}
        color="orange"
      />
    </div>
  )
}