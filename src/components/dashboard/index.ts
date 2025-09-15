// Dashboard Components Export Index
// Central file for importing all dashboard components

// Stats Components
export { 
  StatsCard, 
  StatsCardSkeleton, 
  StatsGrid 
} from './stats-card';

export { 
  DashboardStats,
  EventStats,
  FacultyStats,
  SessionStats
} from './dashboard-stats';

// Navigation Components
export { 
  NavigationSidebar, 
  MobileSidebar 
} from './sidebar';

// Header Components - explicit import first
import { DashboardHeader, HeaderStats } from './header';
export { DashboardHeader, HeaderStats };

// Layout Components
export { 
  DashboardLayout,
  OrganizerLayout,
  FacultyLayout,
  HallCoordinatorLayout,
  EventManagerLayout,
  DelegateLayout,
  SponsorLayout,
  VolunteerLayout,
  VendorLayout,
  DashboardPage,
  DashboardSection
} from './layout';

// Usage Example:
// import { 
//   OrganizerLayout, 
//   DashboardPage, 
//   DashboardStats 
// } from '@/components/dashboard'