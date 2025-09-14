'use client'
 
import { useState } from 'react'
import { Button } from '@/components/ui'
import { signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui'
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
import { useTheme } from 'next-themes'
 
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
  const notifications: NotificationItem[] = [
    // {
    //   id: '1',
    //   title: 'Faculty Confirmation',
    //   message: 'Dr. Sarah Johnson confirmed for Cardiology session',
    //   time: '2 min ago',
    //   type: 'success',
    //   read: false
    // },
    // {
    //   id: '2',
    //   title: 'Session Reminder',
    //   message: 'Neurology session starts in 2 hours',
    //   time: '1 hour ago',
    //   type: 'warning',
    //   read: false
    // },
    // {
    //   id: '3',
    //   title: 'New Registration',
    //   message: '25 new delegate registrations today',
    //   time: '3 hours ago',
    //   type: 'info',
    //   read: true
    // }
  ]

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
        console.log('👋 User logging out...')
        
        await signOut({ 
          callbackUrl: '/',
          redirect: true  
        })
        
        console.log('✅ Logout successful')
      } catch (error) {
        console.error('❌ Logout error:', error)
        setIsLoggingOut(false)
        router.push('/')
      }
    }

  return (
    <header className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          {/* <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events, faculty, sessions..."
              className="pl-10 w-64 lg:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* <Button variant="ghost" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button> */}
            {/* <Button variant="ghost" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button> */}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <span className="text-sm text-gray-500">{unreadCount} unread</span>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification.type)}`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" className="w-full text-sm">
                    View All Notifications
                  </Button>
                </div>
              </div> 
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{userName}</p>
                      <p className="text-xs text-gray-500">{userRole}</p>
                    </div>
                  </div>
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
                  <Button variant="ghost" className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleLogout}
                    disabled={isLoggingOut}>
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
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