// src/components/sessions/session-list.tsx
'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  SearchIcon,
  FilterIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  CopyIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  PresentationIcon,
  Coffee,
  Users2Icon,
  BookOpenIcon,
  MicIcon,
  SortAscIcon,
  SortDescIcon,
  ListIcon,
  GridIcon
} from 'lucide-react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Checkbox,
  Alert,
  AlertDescription,
  Separator,
  Progress,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';
import { cn } from '@/lib/utils';

// Types
interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  sessionType: string;
  hallId?: string;
  maxParticipants?: number;
  isBreak?: boolean;
  speakers: Array<{
    user: { 
      id: string;
      name: string; 
      institution?: string;
      profileImage?: string;
    };
    role: string;
  }>;
  hall?: {
    id: string;
    name: string;
    capacity: number;
    location?: string;
  };
  _count: {
    speakers: number;
    presentations: number;
    attendanceRecords: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface SessionListProps {
  sessions: Session[];
  loading?: boolean;
  onEdit?: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
  onView?: (sessionId: string) => void;
  onDuplicate?: (session: Session) => void;
  onBulkAction?: (action: string, sessionIds: string[]) => void;
  showBulkActions?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  viewMode?: 'table' | 'grid' | 'compact';
  className?: string;
}

// Constants
const SESSION_TYPE_CONFIG = {
  KEYNOTE: { 
    label: 'Keynote', 
    icon: MicIcon, 
    color: 'bg-purple-100 text-purple-800 border-purple-300' 
  },
  PRESENTATION: { 
    label: 'Presentation', 
    icon: PresentationIcon, 
    color: 'bg-blue-100 text-blue-800 border-blue-300' 
  },
  PANEL: { 
    label: 'Panel Discussion', 
    icon: Users2Icon, 
    color: 'bg-green-100 text-green-800 border-green-300' 
  },
  WORKSHOP: { 
    label: 'Workshop', 
    icon: BookOpenIcon, 
    color: 'bg-orange-100 text-orange-800 border-orange-300' 
  },
  POSTER: { 
    label: 'Poster Session', 
    icon: PresentationIcon, 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300' 
  },
  BREAK: { 
    label: 'Break', 
    icon: Coffee, 
    color: 'bg-gray-100 text-gray-600 border-gray-300' 
  }
};

const SESSION_STATUS = {
  UPCOMING: { label: 'Upcoming', color: 'bg-blue-100 text-blue-800', icon: CalendarIcon },
  ONGOING: { label: 'Ongoing', color: 'bg-green-100 text-green-800', icon: PlayIcon },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: CheckCircleIcon },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircleIcon }
};

const SORT_OPTIONS = [
  { value: 'startTime', label: 'Start Time' },
  { value: 'title', label: 'Title' },
  { value: 'sessionType', label: 'Type' },
  { value: 'speakers', label: 'Speakers' },
  { value: 'attendance', label: 'Attendance' }
];

export function SessionList({
  sessions,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onBulkAction,
  showBulkActions = true,
  showFilters = true,
  showStats = true,
  viewMode: initialViewMode = 'table',
  className
}: SessionListProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterHall, setFilterHall] = useState<string>('');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState(initialViewMode);

  // Get session status
  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    if (now < startTime) return 'UPCOMING';
    if (now >= startTime && now <= endTime) return 'ONGOING';
    return 'COMPLETED';
  };

  // Get unique halls
  const halls = useMemo(() => {
    const hallMap = new Map();
    sessions.forEach(session => {
      if (session.hall) {
        hallMap.set(session.hall.id, session.hall);
      }
    });
    return Array.from(hallMap.values());
  }, [sessions]);

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      // Search filter
      if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType && session.sessionType !== filterType) {
        return false;
      }
      
      // Hall filter
      if (filterHall && session.hallId !== filterHall) {
        return false;
      }
      
      // Status filter
      if (filterStatus) {
        const status = getSessionStatus(session);
        if (status !== filterStatus) {
          return false;
        }
      }
      
      return true;
    });

    // Sort sessions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'sessionType':
          aValue = a.sessionType;
          bValue = b.sessionType;
          break;
        case 'speakers':
          aValue = a._count.speakers;
          bValue = b._count.speakers;
          break;
        case 'attendance':
          aValue = a._count.attendanceRecords;
          bValue = b._count.attendanceRecords;
          break;
        default:
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [sessions, searchQuery, filterType, filterHall, filterStatus, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedSessions.length;
    const upcoming = filteredAndSortedSessions.filter(s => getSessionStatus(s) === 'UPCOMING').length;
    const ongoing = filteredAndSortedSessions.filter(s => getSessionStatus(s) === 'ONGOING').length;
    const completed = filteredAndSortedSessions.filter(s => getSessionStatus(s) === 'COMPLETED').length;
    const totalSpeakers = filteredAndSortedSessions.reduce((sum, s) => sum + s._count.speakers, 0);
    const totalAttendance = filteredAndSortedSessions.reduce((sum, s) => sum + s._count.attendanceRecords, 0);
    
    return {
      total,
      upcoming,
      ongoing,
      completed,
      totalSpeakers,
      totalAttendance
    };
  }, [filteredAndSortedSessions]);

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessions(filteredAndSortedSessions.map(s => s.id));
    } else {
      setSelectedSessions([]);
    }
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSessions([...selectedSessions, sessionId]);
    } else {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedSessions.length === 0) return;
    onBulkAction?.(action, selectedSessions);
    setSelectedSessions([]);
  };

  // Render session type badge
  const renderTypeBadge = (sessionType: string) => {
    const config = SESSION_TYPE_CONFIG[sessionType as keyof typeof SESSION_TYPE_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Render status badge
  const renderStatusBadge = (session: Session) => {
    const status = getSessionStatus(session);
    const statusInfo = SESSION_STATUS[status as keyof typeof SESSION_STATUS];
    const StatusIcon = statusInfo.icon;
    
    return (
      <Badge className={statusInfo.color}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  // Render speakers
  const renderSpeakers = (speakers: Session['speakers'], maxShow: number = 2) => {
    if (speakers.length === 0) {
      return <span className="text-gray-400">No speakers</span>;
    }

    const visibleSpeakers = speakers.slice(0, maxShow);
    const remainingCount = speakers.length - maxShow;

    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {visibleSpeakers.map((speaker, index) => (
            <Tooltip key={speaker.user.id}>
              <TooltipTrigger>
                <Avatar className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={speaker.user.profileImage} />
                  <AvatarFallback className="text-xs">
                    {speaker.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">{speaker.user.name}</div>
                  <div className="text-gray-600">{speaker.role}</div>
                  {speaker.user.institution && (
                    <div className="text-gray-500">{speaker.user.institution}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        <div className="text-sm">
          {visibleSpeakers[0] && (
            <div className="font-medium">{visibleSpeakers[0].user.name}</div>
          )}
          {remainingCount > 0 && (
            <div className="text-gray-600">+{remainingCount} more</div>
          )}
        </div>
      </div>
    );
  };

  // Table View
  const TableView = () => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {showBulkActions && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedSessions.length === filteredAndSortedSessions.length && filteredAndSortedSessions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="min-w-[200px]">
              <Button
                variant="ghost"
                onClick={() => {
                  if (sortBy === 'title') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('title');
                    setSortOrder('asc');
                  }
                }}
                className="h-8 p-0 font-medium"
              >
                Session
                {sortBy === 'title' && (
                  sortOrder === 'asc' ? <SortAscIcon className="ml-2 h-4 w-4" /> : <SortDescIcon className="ml-2 h-4 w-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => {
                  if (sortBy === 'startTime') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('startTime');
                    setSortOrder('asc');
                  }
                }}
                className="h-8 p-0 font-medium"
              >
                Date & Time
                {sortBy === 'startTime' && (
                  sortOrder === 'asc' ? <SortAscIcon className="ml-2 h-4 w-4" /> : <SortDescIcon className="ml-2 h-4 w-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>Hall</TableHead>
            <TableHead>Speakers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Attendance</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={showBulkActions ? 9 : 8}>
                  <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : filteredAndSortedSessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showBulkActions ? 9 : 8} className="text-center py-8">
                <div className="text-gray-500">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div>No sessions found</div>
                  <div className="text-sm">Try adjusting your filters</div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedSessions.map((session) => (
              <TableRow key={session.id} className="hover:bg-gray-50">
                {showBulkActions && (
                  <TableCell>
                    <Checkbox
                      checked={selectedSessions.includes(session.id)}
                      onCheckedChange={(checked) => handleSelectSession(session.id, !!checked)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <div className="font-medium">{session.title}</div>
                    {session.description && (
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {session.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {renderTypeBadge(session.sessionType)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{format(new Date(session.startTime), 'MMM dd, yyyy')}</div>
                    <div className="text-gray-600">
                      {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {session.hall ? (
                    <div className="text-sm">
                      <div className="font-medium">{session.hall.name}</div>
                      <div className="text-gray-600">Cap: {session.hall.capacity}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">No hall</span>
                  )}
                </TableCell>
                <TableCell>
                  {renderSpeakers(session.speakers)}
                </TableCell>
                <TableCell>
                  {renderStatusBadge(session)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm">
                    <div className="font-medium">{session._count.attendanceRecords}</div>
                    {session.maxParticipants && (
                      <div className="text-gray-600">/ {session.maxParticipants}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(session.id)}>
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(session)}>
                        <EditIcon className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate?.(session)}>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(session.id)}
                        className="text-red-600"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Grid View
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : filteredAndSortedSessions.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        filteredAndSortedSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm line-clamp-2">{session.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {renderTypeBadge(session.sessionType)}
                    {renderStatusBadge(session)}
                  </div>
                </div>
                {showBulkActions && (
                  <Checkbox
                    checked={selectedSessions.includes(session.id)}
                    onCheckedChange={(checked) => handleSelectSession(session.id, !!checked)}
                    className="ml-2"
                  />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(session.id)}>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(session)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate?.(session)}>
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(session.id)}
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(session.startTime), 'MMM dd, HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                  </span>
                </div>
                
                {session.hall && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span>{session.hall.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-gray-500" />
                  <span>{session._count.speakers} speakers</span>
                </div>

                {session._count.attendanceRecords > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-600">
                      {session._count.attendanceRecords} attendees
                    </span>
                    {session.maxParticipants && (
                      <Progress 
                        value={(session._count.attendanceRecords / session.maxParticipants) * 100} 
                        className="w-16 h-2"
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Sessions
              <Badge variant="outline">{stats.total}</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table" className="flex items-center gap-1">
                    <ListIcon className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="flex items-center gap-1">
                    <GridIcon className="h-4 w-4" />
                    Grid
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {Object.entries(SESSION_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  {Object.entries(SESSION_STATUS).map(([key, status]) => (
                    <SelectItem key={key} value={key}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {halls.length > 0 && (
                <Select value={filterHall} onValueChange={setFilterHall}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Hall" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Halls</SelectItem>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>{hall.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold">{stats.total}</div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{stats.upcoming}</div>
                <div className="text-gray-600">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{stats.ongoing}</div>
                <div className="text-gray-600">Ongoing</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">{stats.completed}</div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{stats.totalSpeakers}</div>
                <div className="text-gray-600">Speakers</div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {showBulkActions && selectedSessions.length > 0 && (
            <Alert>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedSessions.length} session(s) selected</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('duplicate')}
                  >
                    <CopyIcon className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          {viewMode === 'table' ? <TableView /> : <GridView />}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}