'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  ChevronDown,
  MessageSquare, 
  Calendar,
  Clock,
  Globe
} from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
}

interface DashboardHeaderProps {
  userName?: string
  userRole?: string
  organizerName?: string
  eventManagerName?: string
  onMobileMenuClick?: () => void
  className?: string
}

export function DashboardHeader({ 
  userName = "John Doe", 
  userRole = "Organizer",
  organizerName,
  eventManagerName,
  onMobileMenuClick,
  className 
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Mock notifications
  const notifications: NotificationItem[] = []

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className={cn(
      "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3",
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Mobile menu button and search */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Search */}
          <div className="hidden md:flex relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events, sessions, faculty..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right side - Theme, Notifications, User Menu */}
        <div className="flex items-center gap-2">
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification.type)}`} />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                            <span className="text-xs text-gray-500 mt-1">{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="ghost" className="w-full text-xs">
                      Mark all as read
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-3 pr-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-gray-500 capitalize">{userRole.toLowerCase().replace('_', ' ')}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-sm">{userName}</div>
                  <div className="text-xs text-gray-500 capitalize">{userRole.toLowerCase().replace('_', ' ')}</div>
                  <div className="text-xs text-gray-400 mt-1">Managing Conference</div>
                </div>
                
                <div className="p-2">
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <User className="h-4 w-4 mr-3" />
                    My Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <Globe className="h-4 w-4 mr-3" />
                    Language
                  </Button>
                </div>
                
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="mt-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </header>
  )
}

// Quick stats in header for some roles
interface HeaderStatsProps {
  stats: Array<{
    label: string
    value: string | number
    color?: string
  }>
}

export function HeaderStats({ stats }: HeaderStatsProps) {
  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stat.color || 'bg-blue-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}:</span>
          <span className="text-sm font-medium">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}