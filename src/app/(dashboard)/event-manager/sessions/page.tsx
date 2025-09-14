"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  GridIcon,
  ListIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Checkbox,
} from "@/components/ui";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import {
  useSessionsByEvent,
  useDeleteSession,
  useSessionStats,
} from "@/hooks/use-sessions";
import { useEvents } from "@/hooks/use-events";
import { SessionForm } from "@/components/sessions/session-form";
import ScheduleBuilder from "@/components/sessions/schedule-builder";

// Types
interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  sessionType: string;
  hallId?: string;
  maxParticipants?: number;
  isBreak?: boolean;
  speakers?: Array<{
    id: string;
    userId: string;
    role: "SPEAKER" | "MODERATOR" | "CHAIRPERSON" | string;
    user: {
      id: string;
      name: string;
      email: string;
      designation?: string;
      institution?: string;
      profileImage?: string;
    };
  }>;
  hall?: {
    id: string;
    name: string;
    capacity: number;
  };
  _count: {
    speakers: number;
    presentations: number;
    attendanceRecords: number;
  };
}

// Constants
const SESSION_TYPE_COLORS = {
  KEYNOTE: "bg-purple-100 text-purple-800 border-purple-300",
  PRESENTATION: "bg-blue-100 text-blue-800 border-blue-300",
  PANEL: "bg-green-100 text-green-800 border-green-300",
  WORKSHOP: "bg-orange-100 text-orange-800 border-orange-300",
  POSTER: "bg-cyan-100 text-cyan-800 border-cyan-300",
  BREAK: "bg-gray-100 text-gray-600 border-gray-300",
};

const SESSION_STATUS = {
  UPCOMING: {
    label: "Upcoming",
    color: "bg-blue-100 text-blue-800",
    icon: CalendarIcon,
  },
  ONGOING: {
    label: "Ongoing",
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-gray-100 text-gray-600",
    icon: CheckCircleIcon,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircleIcon,
  },
};

export default function SessionsPage() {
  const router = useRouter();

  // State
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterHall, setFilterHall] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "schedule">(
    "table"
  );
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Hooks
  const { data: eventsData } = useEvents({ limit: 100 });
  const events = eventsData?.data?.events || [];

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch,
  } = useSessionsByEvent(selectedEvent, {
    search: searchQuery,
    sessionType: filterType === "ALL" ? undefined : filterType,
    hallId: filterHall === "ALL" ? undefined : filterHall,
    sortBy: "startTime",
    sortOrder: "asc",
    limit: 100,
  });

  const { data: statsData } = useSessionStats(selectedEvent);
  const deleteSession = useDeleteSession();

  const sessions = sessionsData?.data?.sessions || [];
  const stats = statsData?.data || {};

  // Get unique halls from sessions
  const halls = useMemo(() => {
    const hallMap = new Map();
    sessions.forEach((session) => {
      if (session.hall) {
        hallMap.set(session.hall.id, session.hall);
      }
    });
    return Array.from(hallMap.values());
  }, [sessions]);

  // Filter sessions
  // Filter sessions
  const filteredSessions = useMemo(() => {
    console.log("🔍 Debug filtering:", {
      totalSessions: sessions.length,
      sampleSession: sessions[0],
      filterType,
      filterStatus,
      filterHall,
      searchQuery,
    });

    const result = sessions.filter((session) => {
      // Search filter
      if (
        searchQuery &&
        !session.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        console.log("❌ Filtered out by search:", session.title);
        return false;
      }

      // Type filter
      if (
        filterType &&
        filterType !== "ALL" &&
        session.sessionType !== filterType
      ) {
        console.log(
          "❌ Filtered out by type:",
          session.title,
          session.sessionType,
          "vs",
          filterType
        );
        return false;
      }

      // Hall filter
      if (filterHall && filterHall !== "ALL" && session.hallId !== filterHall) {
        console.log(
          "❌ Filtered out by hall:",
          session.title,
          session.hallId,
          "vs",
          filterHall
        );
        return false;
      }

      // Status filter
      if (filterStatus && filterStatus !== "ALL") {
        const now = new Date();
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);

        const status =
          now < startTime
            ? "UPCOMING"
            : now >= startTime && now <= endTime
            ? "ONGOING"
            : "COMPLETED";

        if (status !== filterStatus) {
          console.log(
            "❌ Filtered out by status:",
            session.title,
            status,
            "vs",
            filterStatus
          );
          return false;
        }
      }

      console.log("✅ Session passed filters:", session.title);
      return true;
    });

    console.log("🔍 Filtering result:", {
      original: sessions.length,
      filtered: result.length,
      resultTitles: result.map((s) => s.title),
    });

    return result;
  }, [sessions, searchQuery, filterType, filterHall, filterStatus]);

  // Get session status
  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    if (now < startTime) return "UPCOMING";
    if (now >= startTime && now <= endTime) return "ONGOING";
    return "COMPLETED";
  };

  // Handle session actions
  const handleCreateSession = () => {
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSession.mutateAsync(sessionId);
        refetch();
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
  };

  const handleViewSession = (sessionId: string) => {
    router.push(`/event-manager/sessions/${sessionId}`);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for sessions:`, selectedSessions);
    setSelectedSessions([]);
  };

  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalSessions || 0}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {stats.completedSessions || 0}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mr-4">
            <ClockIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {stats.upcomingSessions || 0}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
            <UsersIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalSpeakers || 0}</div>
            <div className="text-sm text-gray-600">Total Speakers</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Table View Component
  // Table View Component
  // const TableView = () => {
  //   // Use sessions directly instead of filteredSessions to test
  //   const displaySessions = sessions; // Change this temporarily to bypass filtering

  //   return (
  //     <Card>
  //       <CardHeader>
  //         <div className="flex items-center justify-between">
  //           <CardTitle>Sessions List</CardTitle>
  //           <div className="flex items-center gap-2">
  //             {selectedSessions.length > 0 && (
  //               <div className="flex items-center gap-2">
  //                 <span className="text-sm text-gray-600">
  //                   {selectedSessions.length} selected
  //                 </span>
  //                 <DropdownMenu>
  //                   <DropdownMenuTrigger asChild>
  //                     <Button variant="outline" size="sm">
  //                       Bulk Actions
  //                     </Button>
  //                   </DropdownMenuTrigger>
  //                   <DropdownMenuContent>
  //                     <DropdownMenuItem
  //                       onClick={() => handleBulkAction("delete")}
  //                     >
  //                       <TrashIcon className="h-4 w-4 mr-2" />
  //                       Delete Selected
  //                     </DropdownMenuItem>
  //                     <DropdownMenuItem
  //                       onClick={() => handleBulkAction("export")}
  //                     >
  //                       <DownloadIcon className="h-4 w-4 mr-2" />
  //                       Export Selected
  //                     </DropdownMenuItem>
  //                   </DropdownMenuContent>
  //                 </DropdownMenu>
  //               </div>
  //             )}
  //             <Button onClick={handleCreateSession}>
  //               <PlusIcon className="h-4 w-4 mr-2" />
  //               Add Session
  //             </Button>
  //           </div>
  //         </div>
  //       </CardHeader>
  //       <CardContent>
  //         {displaySessions.length === 0 ? (
  //           <div className="text-center py-8">
  //             <h3 className="text-lg font-medium text-gray-900 mb-2">
  //               No Sessions Found
  //             </h3>
  //             <p className="text-gray-600">
  //               {selectedEvent
  //                 ? "No sessions have been created for this event yet."
  //                 : "Select an event to view its sessions."}
  //             </p>
  //             {/* Debug info */}
  //             <div className="text-xs text-gray-400 mt-2">
  //               Debug: sessions={sessions.length}, filtered=
  //               {filteredSessions.length}
  //             </div>
  //           </div>
  //         ) : (
  //           <div className="overflow-x-auto">
  //             <Table>
  //               <TableHeader>
  //                 <TableRow>
  //                   <TableHead className="w-12">
  //                     <Checkbox
  //                       checked={
  //                         selectedSessions.length === displaySessions.length
  //                       }
  //                       onCheckedChange={(checked) => {
  //                         if (checked) {
  //                           setSelectedSessions(
  //                             displaySessions.map((s) => s.id)
  //                           );
  //                         } else {
  //                           setSelectedSessions([]);
  //                         }
  //                       }}
  //                     />
  //                   </TableHead>
  //                   <TableHead>Session</TableHead>
  //                   <TableHead>Type</TableHead>
  //                   <TableHead>Date & Time</TableHead>
  //                   <TableHead>Hall</TableHead>
  //                   <TableHead>Speakers</TableHead>
  //                   <TableHead>Status</TableHead>
  //                   <TableHead>Attendance</TableHead>
  //                   <TableHead className="w-16">Actions</TableHead>
  //                 </TableRow>
  //               </TableHeader>
  //               <TableBody>
  //                 {displaySessions.map((session) => {
  //                   const status = getSessionStatus(session);
  //                   const statusInfo =
  //                     SESSION_STATUS[status as keyof typeof SESSION_STATUS];
  //                   const StatusIcon = statusInfo.icon;

  //                   return (
  //                     <TableRow key={session.id} className="hover:bg-gray-50">
  //                       <TableCell>
  //                         <Checkbox
  //                           checked={selectedSessions.includes(session.id)}
  //                           onCheckedChange={(checked) => {
  //                             if (checked) {
  //                               setSelectedSessions([
  //                                 ...selectedSessions,
  //                                 session.id,
  //                               ]);
  //                             } else {
  //                               setSelectedSessions(
  //                                 selectedSessions.filter(
  //                                   (id) => id !== session.id
  //                                 )
  //                               );
  //                             }
  //                           }}
  //                         />
  //                       </TableCell>
  //                       <TableCell>
  //                         <div>
  //                           <div className="font-medium">{session.title}</div>
  //                           <div className="text-sm text-gray-600 truncate max-w-xs">
  //                             {session.description}
  //                           </div>
  //                         </div>
  //                       </TableCell>
  //                       <TableCell>
  //                         <Badge
  //                           className={
  //                             SESSION_TYPE_COLORS[
  //                               session.sessionType as keyof typeof SESSION_TYPE_COLORS
  //                             ]
  //                           }
  //                         >
  //                           {session.sessionType}
  //                         </Badge>
  //                       </TableCell>
  //                       <TableCell>
  //                         <div className="text-sm">
  //                           <div>
  //                             {format(
  //                               new Date(session.startTime),
  //                               "MMM dd, yyyy"
  //                             )}
  //                           </div>
  //                           <div className="text-gray-600">
  //                             {format(new Date(session.startTime), "HH:mm")} -{" "}
  //                             {format(new Date(session.endTime), "HH:mm")}
  //                           </div>
  //                         </div>
  //                       </TableCell>
  //                       <TableCell>
  //                         {session.hall ? (
  //                           <div className="text-sm">
  //                             <div className="font-medium">
  //                               {session.hall.name}
  //                             </div>
  //                             <div className="text-gray-600">
  //                               Cap: {session.hall.capacity}
  //                             </div>
  //                           </div>
  //                         ) : (
  //                           <span className="text-gray-400">No hall</span>
  //                         )}
  //                       </TableCell>
  //                       <TableCell>
  //                         <div className="text-sm">
  //                           {session.speakers.length > 0 ? (
  //                             <>
  //                               <div className="font-medium">
  //                                 {session.speakers[0].user.name}
  //                               </div>
  //                               {session.speakers.length > 1 && (
  //                                 <div className="text-gray-600">
  //                                   +{session.speakers.length - 1} more
  //                                 </div>
  //                               )}
  //                             </>
  //                           ) : (
  //                             <span className="text-gray-400">No speakers</span>
  //                           )}
  //                         </div>
  //                       </TableCell>
  //                       <TableCell>
  //                         <Badge className={statusInfo.color}>
  //                           <StatusIcon className="h-3 w-3 mr-1" />
  //                           {statusInfo.label}
  //                         </Badge>
  //                       </TableCell>
  //                       <TableCell>
  //                         <div className="text-sm">
  //                           <div className="font-medium">
  //                             {session._count.attendanceRecords}
  //                           </div>
  //                           {session.maxParticipants && (
  //                             <div className="text-gray-600">
  //                               / {session.maxParticipants}
  //                             </div>
  //                           )}
  //                         </div>
  //                       </TableCell>
  //                       <TableCell>
  //                         <DropdownMenu>
  //                           <DropdownMenuTrigger asChild>
  //                             <Button variant="ghost" size="sm">
  //                               <MoreHorizontalIcon className="h-4 w-4" />
  //                             </Button>
  //                           </DropdownMenuTrigger>
  //                           <DropdownMenuContent align="end">
  //                             <DropdownMenuItem
  //                               onClick={() => handleViewSession(session.id)}
  //                             >
  //                               <EyeIcon className="h-4 w-4 mr-2" />
  //                               View Details
  //                             </DropdownMenuItem>
  //                             <DropdownMenuItem
  //                               onClick={() => handleEditSession(session)}
  //                             >
  //                               <EditIcon className="h-4 w-4 mr-2" />
  //                               Edit
  //                             </DropdownMenuItem>
  //                             <DropdownMenuItem>
  //                               <CopyIcon className="h-4 w-4 mr-2" />
  //                               Duplicate
  //                             </DropdownMenuItem>
  //                             <DropdownMenuSeparator />
  //                             <DropdownMenuItem
  //                               onClick={() => handleDeleteSession(session.id)}
  //                               className="text-red-600"
  //                             >
  //                               <TrashIcon className="h-4 w-4 mr-2" />
  //                               Delete
  //                             </DropdownMenuItem>
  //                           </DropdownMenuContent>
  //                         </DropdownMenu>
  //                       </TableCell>
  //                     </TableRow>
  //                   );
  //                 })}
  //               </TableBody>
  //             </Table>
  //           </div>
  //         )}
  //       </CardContent>
  //     </Card>
  //   );
  // };

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredSessions.map((session) => {
        const status = getSessionStatus({
          ...session,
          _count: session._count || {
            speakers: 0,
            presentations: 0,
            attendanceRecords: 0
          },
        });
        const statusInfo =
          SESSION_STATUS[status as keyof typeof SESSION_STATUS];
        const StatusIcon = statusInfo.icon;

        return (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm">{session.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={
                        SESSION_TYPE_COLORS[
                          session.sessionType as keyof typeof SESSION_TYPE_COLORS
                        ]
                      }
                    >
                      {session.sessionType}
                    </Badge>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleViewSession(session.id)}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleEditSession({
                          ...session,
                          _count: session._count || {
                            speakers: 0,
                            presentations: 0,
                            attendanceRecords: 0,
                          },
                        })
                      }
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(session.startTime), "MMM dd, HH:mm")} -{" "}
                    {format(new Date(session.endTime), "HH:mm")}
                  </span>
                </div>

                {session.hall && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span>{session.hall.name}</span>
                  </div>
                )}

                {(session.speakers ?? []).length > 0 && (
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      {(session.speakers ?? []).map((s) => s.user.name).join(", ")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-600">
                    {(session._count?.attendanceRecords ?? 0)} attendees
                  </div>
                  <div className="text-xs text-gray-600">
                    {(session._count?.speakers ?? 0)} speakers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions Management</h1>
          <p className="text-gray-600">Organize and manage event sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/event-manager/sessions/schedule")}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule View
          </Button>
          <Button onClick={handleCreateSession}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </div>
      </div>

      {/* Event Selector */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {Object.keys(SESSION_TYPE_COLORS).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  {Object.entries(SESSION_STATUS).map(([key, status]) => (
                    <SelectItem key={key} value={key}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterHall} onValueChange={setFilterHall}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Hall" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Halls</SelectItem>
                  {halls.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent ? (
        <>
          {/* Statistics */}
          <StatisticsCards />

          {/* Content Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(value: any) => setViewMode(value)}
          >
            <div className="flex items-center justify-between">
              <TabsList>
                {/* <TabsTrigger value="table" className="flex items-center gap-2">
                  <ListIcon className="h-4 w-4" />
                  Table
                </TabsTrigger> */}
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <GridIcon className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Schedule
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {filteredSessions.length} of {sessions.length} sessions
                </span>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* <TabsContent value="table" className="mt-4">
              <TableView />
            </TabsContent> */}

            <TabsContent value="grid" className="mt-4">
              <GridView />
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <ScheduleBuilder
                eventId={selectedEvent}
                halls={halls}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select an Event
              </h3>
              <p className="text-gray-600">
                Choose an event to manage its sessions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Form Dialog */}
      <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSession ? "Edit Session" : "Create New Session"}
            </DialogTitle>
          </DialogHeader>
          <SessionForm
            eventId={selectedEvent}
            session={
              selectedSession
                ? {
                    ...selectedSession,
                    startTime:
                      typeof selectedSession.startTime === "string"
                        ? new Date(selectedSession.startTime)
                        : selectedSession.startTime,
                    endTime:
                      typeof selectedSession.endTime === "string"
                        ? new Date(selectedSession.endTime)
                        : selectedSession.endTime,
                  }
                : null
            }
            halls={halls}
            onSuccess={(session) => {
              setShowSessionForm(false);
              setSelectedSession(null);
              refetch();
            }}
            onCancel={() => {
              setShowSessionForm(false);
              setSelectedSession(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
