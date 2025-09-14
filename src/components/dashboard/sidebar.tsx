"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
// import ApprovalsModal from "@/app/modals/ApprovalsModal";
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
  // | "DELEGATE"
  // | "HALL_COORDINATOR"
  // | "SPONSOR"
  // | "VOLUNTEER"
  // | "VENDOR";
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  className?: string;
}

const getNavigationItems = (
  role: SidebarProps["userRole"]
): NavigationItem[] => {
  const commonItems: NavigationItem[] = [
    // {
    //   label: "Dashboard",
    //   href: "/event-manager",
    //   icon: Home,
    // },
  ];

  const roleSpecificItems: Record<SidebarProps["userRole"], NavigationItem[]> =
    {
      ORGANIZER: [
        {
          label: "Dashboard",
          href: "/organizer",
          icon: Home,
        },
        {
          label: "Visual Representation", // NEW: Added Visual Representation
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
        // {
        //   label: "Reports",
        //   href: "",
        //   icon: BarChart3,
        //   children: [
        //     {
        //       label: "Analytics",
        //       href: "/organizer/reports/analytics",
        //       icon: BarChart3,
        //     },
        //     {
        //       label: "Export Data",
        //       href: "/organizer/reports/export",
        //       icon: Download,
        //     },
        //   ],
        // },
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
        // {
        //   label: "Reports",
        //   href: "",
        //   icon: BarChart3,
        //   children: [
        //     {
        //       label: "Event Reports",
        //       href: "/event-manager/reports",
        //       icon: BarChart3,
        //     },
        //     {
        //       label: "Analytics",
        //       href: "/event-manager/reports/analytics",
        //       icon: BarChart3,
        //     },
        //     {
        //       label: "Export Data",
        //       href: "/event-manager/reports/export",
        //       icon: Download,
        //     },
        //   ],
        // },
      ],
      FACULTY: [
        {
          label: "Dashboard",
          href: "/faculty",
          icon: Monitor,
        },
        {
          label: "My Profile",
          href: "/faculty/profile",
          icon: Users,
        },
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
              action: "openUploadDocumentsModal", // FIXED: Changed from "uploadDocumentsModal"
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
  userAvatar,
  className,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const [isPendingApprovalsModalOpen, setIsPendingApprovalsModalOpen] =
    useState(false);
  const [isAcceptedApprovalsModalOpen, setIsAcceptedApprovalsModalOpen] =
    useState(false);
  const [isRejectedApprovalsModalOpen, setIsRejectedApprovalsModalOpen] =
    useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isUploadDocumentsModalOpen, setIsUploadDocumentsModalOpen] =
    useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] =
    useState(false);
  const [isTravelDetailsModalOpen, setIsTravelDetailsModalOpen] =
    useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { data: session } = useSession();
  const facultyId = session?.user?.id;

  const navigationItems = getNavigationItems(userRole);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  // Hardened: ignore falsy/invalid hrefs
  const isItemActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Active if parent path is active or any child with a valid href is active
  const isParentActive = (item: NavigationItem) => {
    if (isItemActive(item.href)) return true;
    if (item.children?.length) {
      return item.children.some(
        (child) => child.href && isItemActive(child.href)
      );
    }
    return false;
  };

  // Click behavior with enhanced debugging
  const handleNavClick = (item: NavigationItem, e: React.MouseEvent) => {
    const hasChildren = !!item.children?.length;
    const hasHref = !!item.href;

    console.log("Clicked item:", item.label, "Action:", item.action); // Debug log

    // Handle explicit actions first
    if (item.action === "openDocumentsModal") {
      e.preventDefault();
      console.log("Opening documents modal"); // Debug log
      setIsDocsModalOpen(true);
      return;
    }
    // FIXED: Updated action name to match
    if (item.action === "openUploadDocumentsModal") {
      e.preventDefault();
      console.log("Opening upload documents modal"); // Debug log
      setIsUploadDocumentsModalOpen(true);
      return;
    }
    if (item.action === "openFeedbackModal") {
      e.preventDefault();
      console.log("Opening feedback modal"); // Debug log
      setIsFeedbackModalOpen(true);
      return;
    }
    if (item.action === "openSupportModal") {
      e.preventDefault();
      console.log("Opening support modal"); // Debug log
      setIsSupportModalOpen(true);
      return;
    }
    if (item.action === "openTravelDetailsModal") {
      e.preventDefault();
      console.log("Opening travel details modal"); // Debug log
      setIsTravelDetailsModalOpen(true);
      return;
    }
    if (item.action === "openAccommodationModal") {
      e.preventDefault();
      console.log("Opening accommodation modal"); // Debug log
      setIsAccommodationModalOpen(true);
      return;
    }

    if (item.action === "openAcceptedApprovalsModal") {
      e.preventDefault();
      console.log("Opening accepted modal"); // Debug log
      setIsAcceptedApprovalsModalOpen(true);
      return;
    }

    if (item.action === "openRejectedApprovalsModal") {
      e.preventDefault();
      console.log("Opening rejected modal"); // Debug log
      setIsRejectedApprovalsModalOpen(true);
      return;
    }

    if (item.action === "openPendingApprovalsModal") {
      e.preventDefault();
      console.log("Opening pending modal"); // Debug log
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

    // Collapsed or leaf items
    if (hasHref) {
      e.preventDefault();
      router.push(item.href!);
      return;
    }

    // No href fallback: just toggle
    if (hasChildren) {
      e.preventDefault();
      toggleExpanded(item.label);
    }
  };

  // Handle child click with debugging
  const handleChildClick = (child: NavigationItem) => {
    console.log(
      "Child clicked:",
      child.label,
      "Action:",
      child.action,
      "Href:",
      child.href
    ); // Debug log

    if (child.action === "openDocumentsModal") {
      console.log("Opening documents modal from child"); // Debug log
      setIsDocsModalOpen(true);
      return;
    }

    // FIXED: Updated action name to match
    if (child.action === "openUploadDocumentsModal") {
      console.log("Opening upload documents modal from child"); // Debug log
      setIsUploadDocumentsModalOpen(true);
      return;
    }

    if (child.action === "openFeedbackModal") {
      console.log("Opening feedback modal from child"); // Debug log
      setIsFeedbackModalOpen(true);
      return;
    }

    if (child.action === "openSupportModal") {
      console.log("Opening support modal from child"); // Debug log
      setIsSupportModalOpen(true);
      return;
    }

    if (child.action === "openTravelDetailsModal") {
      console.log("Opening travel details modal from child"); // Debug log
      setIsTravelDetailsModalOpen(true);
      return;
    }

    if (child.action === "openAccommodationModal") {
      console.log("Opening accommodation modal from child"); // Debug log
      setIsAccommodationModalOpen(true);
      return;
    }

    if (child.action === "openAcceptedApprovalsModal") {
      console.log("Opening accepted modal from child"); // Debug log
      setIsAcceptedApprovalsModalOpen(true);
      return;
    }

    if (child.action === "openRejectedApprovalsModal") {
      console.log("Opening rejected modal from child"); // Debug log
      setIsRejectedApprovalsModalOpen(true);
      return;
    }

    if (child.action === "openPendingApprovalsModal") {
      console.log("Opening pending modal from child"); // Debug log
      setIsPendingApprovalsModalOpen(true);
      return;
    }

    if (child.href) {
      router.push(child.href);
    }
  };

  // Debug modal states
  console.log("Modal states:", {
    pending: isPendingApprovalsModalOpen,
    accepted: isAcceptedApprovalsModalOpen,
    rejected: isRejectedApprovalsModalOpen,
    docs: isDocsModalOpen,
    upload: isUploadDocumentsModalOpen,
    feedback: isFeedbackModalOpen,
    support: isSupportModalOpen,
    travel: isTravelDetailsModalOpen,
    accommodation: isAccommodationModalOpen,
    userRole: userRole,
  });

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
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

        <Button
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
        </Button>
      </div>

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
    </div>
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