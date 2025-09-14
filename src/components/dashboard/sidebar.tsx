"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

import FacultyDocumentsModal from "@/app/modals/FacultyDocumentsModal";
import UploadDocumentsModal from "@/app/modals/UploadDocumentsModal";
import FeedbackModal from "@/app/modals/Feedback";
import ContactSupportModal from "@/app/modals/contact-support";
import TravelInfoModal from "@/app/modals/TravelInfoModal";
import AccommodationInfoModal from "@/app/modals/AccommodationInfoModal";
import AcceptedFacultyModal from "@/app/modals/AcceptedFacultyModal";
import PendingFacultyModal from "@/app/modals/PendingFacultyModal";
import RejectedFacultyModal from "@/app/modals/RejectedFacultyModal";

import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  UserCheck,
  MapPin,
  Bell,
  Award,
  Upload,
  Clock,
  MessageSquare,
  Monitor,
  Plane,
  Hotel,
  QrCode,
  Download,
  Eye,
  UserPlus,
  CalendarPlus,
  Building,
  Briefcase,
  ShoppingBag,
  Edit2,
  Phone,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

interface NavigationItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
  action?: string;
}

interface SidebarProps {
  userRole: "ORGANIZER" | "EVENT_MANAGER" | "FACULTY";
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  className?: string;
}

const getNavigationItems = (
  role: SidebarProps["userRole"]
): NavigationItem[] => {
  const commonItems: NavigationItem[] = [];

  const roleSpecificItems: Record<SidebarProps["userRole"], NavigationItem[]> =
    {
      ORGANIZER: [
        {
          label: "Dashboard",
          href: "/organizer",
          icon: Home,
        },
        {
          label: "Visual Representation",
          href: "/organizer/visual",
          icon: Eye,
        },
        {
          label: "Events",
          href: "/organizer/events",
          icon: Calendar,
        },
        {
          label: "Faculty Management",
          href: "",
          icon: Users,
          children: [
            { label: "All Faculty", href: "/organizer/faculty", icon: Users },
            {
              label: "Documents",
              href: "/organizer/faculty/documents",
              icon: FileText,
            },
          ],
        },
        {
          label: "Sessions",
          href: "",
          icon: Monitor,
          children: [
            {
              label: "All Sessions",
              href: "/organizer/sessions",
              icon: Monitor,
            },
            {
              label: "Schedule Builder",
              href: "/organizer/sessions/schedule",
              icon: Calendar,
            },
          ],
        },
        {
          label: "Hospitality",
          href: "",
          icon: Hotel,
          children: [
            {
              label: "Travel",
              href: "/organizer/hospitality/travel",
              icon: Plane,
            },
            {
              label: "Accommodation",
              href: "/organizer/hospitality/hotels",
              icon: Hotel,
            },
            {
              label: "Mementos",
              href: "/organizer/hospitality/mementos",
              icon: Award,
            },
          ],
        },
        {
          label: "Certificates",
          href: "",
          icon: Award,
          children: [
            {
              label: "Generate",
              href: "/organizer/certificates/generate",
              icon: Award,
            },
            {
              label: "Templates",
              href: "/organizer/certificates/templates",
              icon: FileText,
            },
            {
              label: "Download",
              href: "/organizer/certificates/download",
              icon: Download,
            },
          ],
        },
      ],
      EVENT_MANAGER: [
        {
          label: "Dashboard",
          href: "/event-manager",
          icon: Home,
        },
        {
          label: "Events",
          href: "",
          icon: Calendar,
          children: [
            {
              label: "All Events",
              href: "/event-manager/events",
              icon: Calendar,
            },
            {
              label: "Create Event",
              href: "/event-manager/events/create",
              icon: CalendarPlus,
            },
            {
              label: "Event Analytics",
              href: "/event-manager/events/analytics",
              icon: BarChart3,
            },
          ],
        },
        {
          label: "Faculty",
          href: "",
          icon: Users,
          children: [
            {
              label: "All Faculty",
              href: "/event-manager/faculty",
              icon: Users,
            },
            {
              label: "Invite Faculty",
              href: "/event-manager/faculty/invite",
              icon: UserPlus,
            },
          ],
        },
        {
          label: "Sessions",
          href: "",
          icon: Monitor,
          children: [
            {
              label: "All Sessions",
              href: "/event-manager/sessions",
              icon: Monitor,
            },
            {
              label: "Schedule",
              href: "/event-manager/sessions/schedule",
              icon: Calendar,
            },
            {
              label: "Assignments",
              href: "/event-manager/sessions/assignments",
              icon: Users,
            },
          ],
        },
        {
          label: "Approvals",
          href: "",
          icon: UserCheck,
          children: [
            {
              label: "Pending Requests",
              icon: Clock,
              action: "openPendingApprovalsModal",
            },
            {
              label: "Approved",
              icon: UserCheck,
              action: "openAcceptedApprovalsModal",
            },
            {
              label: "Rejected",
              icon: Eye,
              action: "openRejectedApprovalsModal",
            },
          ],
        },
        {
          label: "Venues",
          href: "",
          icon: MapPin,
          children: [
            {
              label: "All Venues",
              href: "/event-manager/venues",
              icon: MapPin,
            },
            {
              label: "Hall Management",
              href: "/event-manager/venues/halls",
              icon: Building,
            },
            {
              label: "Equipment",
              href: "/event-manager/venues/equipment",
              icon: Settings,
            },
          ],
        },
      ],
      FACULTY: [
        {
          label: "Dashboard",
          href: "/faculty",
          icon: Monitor,
        },
        // {
        //   label: "My Profile",
        //   href: "/faculty/profile",
        //   icon: Users,
        // },
        {
          label: "My Sessions",
          href: "/faculty/sessions",
          icon: Monitor,
        },
        {
          label: "Documents",
          icon: FileText,
          children: [
            {
              label: "Upload Documents",
              icon: Upload,
              action: "openUploadDocumentsModal",
            },
            {
              label: "View/Edit Documents",
              icon: Upload,
              action: "openDocumentsModal",
            },
          ],
        },
        {
          label: "Travel & Stay",
          href: "",
          icon: Plane,
          children: [
            {
              label: "Travel Details",
              icon: Plane,
              action: "openTravelDetailsModal",
            },
            {
              label: "Accommodation",
              icon: Hotel,
              action: "openAccommodationModal",
            },
          ],
        },
        {
          label: "Certificates",
          href: "/faculty/certificates",
          icon: Award,
        },
        {
          label: "Submit Feedback",
          icon: MessageSquare,
          action: "openFeedbackModal",
        },
        {
          label: "Contact Support",
          icon: Phone,
          action: "openSupportModal",
        },
      ],
    };

  return [...commonItems, ...roleSpecificItems[role]];
};

export function NavigationSidebar({
  userRole,
  userName = "John Doe",
  userEmail = "john@example.com",
  userAvatar,
  className,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Modal states (keep all your existing modal states)
  const [isPendingApprovalsModalOpen, setIsPendingApprovalsModalOpen] = useState(false);
  const [isAcceptedApprovalsModalOpen, setIsAcceptedApprovalsModalOpen] = useState(false);
  const [isRejectedApprovalsModalOpen, setIsRejectedApprovalsModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isUploadDocumentsModalOpen, setIsUploadDocumentsModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [isTravelDetailsModalOpen, setIsTravelDetailsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  const { data: session } = useSession();
  const facultyId = session?.user?.id;

  const navigationItems = getNavigationItems(userRole);

  // Mock notifications (you can replace with real data)
  const notifications = [
    {
      id: '1',
      title: 'Faculty Confirmation',
      message: 'Dr. Sarah Johnson confirmed for session',
      time: '2 min ago',
      type: 'success',
      read: false
    },
    {
      id: '2',
      title: 'Session Reminder',
      message: 'Session starts in 2 hours',
      time: '1 hour ago',
      type: 'warning',
      read: false
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isItemActive = (href?: string) => {
  if (!href) return false;
  return pathname === href; // exact match only
};


  const isParentActive = (item: NavigationItem) => {
    if (isItemActive(item.href)) return true;
    if (item.children?.length) {
      return item.children.some(
        (child) => child.href && isItemActive(child.href)
      );
    }
    return false;
  };

  const handleNavClick = (item: NavigationItem, e: React.MouseEvent) => {
    const hasChildren = !!item.children?.length;
    const hasHref = !!item.href;

    // Handle all your existing modal actions
    if (item.action === "openDocumentsModal") {
      e.preventDefault();
      setIsDocsModalOpen(true);
      return;
    }
    if (item.action === "openUploadDocumentsModal") {
      e.preventDefault();
      setIsUploadDocumentsModalOpen(true);
      return;
    }
    if (item.action === "openFeedbackModal") {
      e.preventDefault();
      setIsFeedbackModalOpen(true);
      return;
    }
    if (item.action === "openSupportModal") {
      e.preventDefault();
      setIsSupportModalOpen(true);
      return;
    }
    if (item.action === "openTravelDetailsModal") {
      e.preventDefault();
      setIsTravelDetailsModalOpen(true);
      return;
    }
    if (item.action === "openAccommodationModal") {
      e.preventDefault();
      setIsAccommodationModalOpen(true);
      return;
    }
    if (item.action === "openAcceptedApprovalsModal") {
      e.preventDefault();
      setIsAcceptedApprovalsModalOpen(true);
      return;
    }
    if (item.action === "openRejectedApprovalsModal") {
      e.preventDefault();
      setIsRejectedApprovalsModalOpen(true);
      return;
    }
    if (item.action === "openPendingApprovalsModal") {
      e.preventDefault();
      setIsPendingApprovalsModalOpen(true);
      return;
    }

    if (hasChildren && !isCollapsed && !hasHref) {
      e.preventDefault();
      toggleExpanded(item.label);
      return;
    }

    if (hasChildren && !isCollapsed && hasHref) {
      e.preventDefault();
      router.push(item.href!);
      return;
    }

    if (hasHref) {
      e.preventDefault();
      router.push(item.href!);
      return;
    }

    if (hasChildren) {
      e.preventDefault();
      toggleExpanded(item.label);
    }
  };

  const handleChildClick = (child: NavigationItem) => {
    // Handle all your existing modal actions for children
    if (child.action === "openDocumentsModal") {
      setIsDocsModalOpen(true);
      return;
    }
    if (child.action === "openUploadDocumentsModal") {
      setIsUploadDocumentsModalOpen(true);
      return;
    }
    if (child.action === "openFeedbackModal") {
      setIsFeedbackModalOpen(true);
      return;
    }
    if (child.action === "openSupportModal") {
      setIsSupportModalOpen(true);
      return;
    }
    if (child.action === "openTravelDetailsModal") {
      setIsTravelDetailsModalOpen(true);
      return;
    }
    if (child.action === "openAccommodationModal") {
      setIsAccommodationModalOpen(true);
      return;
    }
    if (child.action === "openAcceptedApprovalsModal") {
      setIsAcceptedApprovalsModalOpen(true);
      return;
    }
    if (child.action === "openRejectedApprovalsModal") {
      setIsRejectedApprovalsModalOpen(true);
      return;
    }
    if (child.action === "openPendingApprovalsModal") {
      setIsPendingApprovalsModalOpen(true);
      return;
    }

    if (child.href) {
      router.push(child.href);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        callbackUrl: '/',
        redirect: true
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      router.push('/');
    }
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40 flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Conference</h2>
                <p className="text-xs text-muted-foreground">Management</p>
              </div>
            </div>
          )}

          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button> */}
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navigationItems.map((item) => {
            const active = isParentActive(item);
            return (
              <div key={item.label}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    isCollapsed && "justify-center"
                  )}
                  onClick={(e) => handleNavClick(item, e)}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>

                      {item.badge && (
                        <span className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {item.children && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems.includes(item.label) && "rotate-90"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(item.label);
                          }}
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </div>

                {item.children &&
                  !isCollapsed &&
                  expandedItems.includes(item.label) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const childActive = isItemActive(child.href);
                        return (
                          <div
                            key={child.label}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                              childActive
                                ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                            onClick={() => handleChildClick(child)}
                            role="button"
                            aria-current={childActive ? "page" : undefined}
                          >
                            <child.icon className="h-3 w-3" />
                            <span>{child.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section - Header Functionalities */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3 shrink-0">
          
          {/* Theme Toggle */}
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8 p-0"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>
          )}

          {/* Notifications */}
          {/* {!isCollapsed && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-full justify-start relative"
              >
                <Bell className="h-4 w-4 mr-3" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button> */}

              {/* Notifications Dropdown */}
              {/* {showNotifications && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <span className="text-sm text-gray-500">{unreadCount} unread</span>
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
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
          )} 

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "w-full justify-start",
                isCollapsed && "justify-center"
              )}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shrink-0">
                <span className="text-white text-xs font-medium">
                  {userName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              {!isCollapsed && (
                <>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userRole}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  {/* <Button variant="ghost" className="w-full justify-start text-sm mb-1">
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </Button> */}
                  <Button variant="ghost" className="w-full justify-start text-sm mb-1">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Collapsed state buttons */}
          {/* {isCollapsed && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full p-2"
                title="Toggle Theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-full p-2 relative"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          )} */}
        </div>
      </div>

      {/* All your existing modals */}
      <>
        {facultyId && (
          <FacultyDocumentsModal
            isOpen={isDocsModalOpen}
            onClose={() => setIsDocsModalOpen(false)}
            facultyId={facultyId}
          />
        )}
        {facultyId && (
          <UploadDocumentsModal
            isOpen={isUploadDocumentsModalOpen}
            onClose={() => setIsUploadDocumentsModalOpen(false)}
            facultyId={facultyId}
          />
        )}
        <AcceptedFacultyModal
          isOpen={isAcceptedApprovalsModalOpen}
          onClose={() => setIsAcceptedApprovalsModalOpen(false)}
        />
        <RejectedFacultyModal
          isOpen={isRejectedApprovalsModalOpen}
          onClose={() => setIsRejectedApprovalsModalOpen(false)}
        />
        <PendingFacultyModal
          isOpen={isPendingApprovalsModalOpen}
          onClose={() => setIsPendingApprovalsModalOpen(false)}
        />
        <FeedbackModal
          open={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
        <ContactSupportModal
          open={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
        <TravelInfoModal
          open={isTravelDetailsModalOpen}
          onClose={() => setIsTravelDetailsModalOpen(false)} 
          mode={"self-arranged"}        
        />
        <AccommodationInfoModal
          open={isAccommodationModalOpen}
          onClose={() => setIsAccommodationModalOpen(false)}
        />
      </>
    </>
  );
}

interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export function MobileSidebar({
  isOpen,
  onCloseAction,
  ...props
}: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCloseAction}
      />
      <div className="fixed left-0 top-0 h-full">
        <NavigationSidebar {...props} />
      </div>
    </div>
  );
}