'use client'

import { useState } from 'react'
import { NavigationSidebar, MobileSidebar } from './sidebar'
import { DashboardHeader, HeaderStats } from './header'
import { cn } from '@/lib/utils'

// Define the complete set of user roles
type UserRole = 'ORGANIZER' | 'EVENT_MANAGER' | 'FACULTY' | 'DELEGATE' | 'HALL_COORDINATOR' | 'SPONSOR' | 'VOLUNTEER' | 'VENDOR'

// Define which roles are currently supported by the sidebar
type SupportedSidebarRole = 'ORGANIZER' | 'EVENT_MANAGER' | 'FACULTY'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName?: string
  userEmail?: string
  userAvatar?: string
  showHeaderStats?: boolean
  headerStats?: Array<{
    label: string
    value: string | number
    color?: string 
  }>
  className?: string
} 

export function DashboardLayout({
  children,
  userRole,
  userName="",
  userEmail="",
  userAvatar,
  showHeaderStats = false,
  headerStats = [],
  className
}: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Map unsupported roles to supported ones for sidebar compatibility
  const getSidebarRole = (role: UserRole): SupportedSidebarRole => {
    const supportedRoles: SupportedSidebarRole[] = ['ORGANIZER', 'EVENT_MANAGER', 'FACULTY']
    
    if (supportedRoles.includes(role as SupportedSidebarRole)) {
      return role as SupportedSidebarRole
    }
    
    // Map unsupported roles to appropriate fallbacks
    const roleMapping: Record<string, SupportedSidebarRole> = {
      'DELEGATE': 'FACULTY',
      'HALL_COORDINATOR': 'EVENT_MANAGER',
      'SPONSOR': 'ORGANIZER',
      'VOLUNTEER': 'FACULTY',
      'VENDOR': 'ORGANIZER'
    }
    
    return roleMapping[role] || 'FACULTY'
  }

  const sidebarRole = getSidebarRole(userRole)
  const statsToShow = headerStats

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900 flex", className)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <NavigationSidebar
          userRole={sidebarRole}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        userRole={sidebarRole}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        onCloseAction={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <DashboardHeader
          userName={userName}
          userRole={userRole} // Pass original role to header
          onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Header Stats (Only if passed from the page, never static) */}
        {showHeaderStats && statsToShow && statsToShow.length > 0 && (
          <HeaderStats stats={statsToShow} />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Specialized layouts for different roles (forward headerStats down from pages if needed)
export function OrganizerLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="ORGANIZER" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function FacultyLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="FACULTY" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function HallCoordinatorLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="HALL_COORDINATOR" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function EventManagerLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="EVENT_MANAGER" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function DelegateLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="DELEGATE" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function SponsorLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="SPONSOR" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function VolunteerLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="VOLUNTEER" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

export function VendorLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="VENDOR" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  );
}

// Page wrapper with consistent padding and spacing
interface DashboardPageProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function DashboardPage({ 
  children, 
  title, 
  description, 
  actions, 
  className 
}: DashboardPageProps) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

// Content sections for consistent spacing
export function DashboardSection({ 
  children, 
  title, 
  description,
  className 
}: {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export interface MobileSidebarProps {
  isOpen: boolean
  userRole: SupportedSidebarRole
  userName: string
  userEmail: string
  userAvatar?: string
  closeSidebar: () => void
}