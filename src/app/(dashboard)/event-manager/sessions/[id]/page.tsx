// src/app/(dashboard)/event-manager/sessions/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, differenceInMinutes } from 'date-fns';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  ShareIcon,
  DownloadIcon,
  PrinterIcon,
  SettingsIcon,
  PlusIcon,
  FileTextIcon,
  QrCodeIcon,
  BarChart3Icon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  MicIcon,
  PresentationIcon,
  Coffee,
  Users2Icon,
  BookOpenIcon,
  ExternalLinkIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  TagIcon,
  StarIcon,
  MessageSquareIcon,
  EyeIcon
} from 'lucide-react';

import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Progress,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider
} from '@/components/ui';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
// Or update the path to the correct location if your breadcrumb component is elsewhere, e.g.:
// } from '@/components/ui/Breadcrumb';
import { cn } from '@/lib/utils';
import { useSessions } from '@/hooks/use-sessions';
import { SessionForm } from '@/components/sessions/session-form';
import { useSessionData } from '@/hooks/use-sessions';

// Types
interface SessionDetails {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  sessionType: string;
  hallId?: string;
  maxParticipants?: number;
  isBreak?: boolean;
  requirements?: string[];
  tags?: string[];
  speakers: Array<{
    id: string;
    user: { 
      id: string;
      name: string; 
      email: string;
      phone?: string;
      institution?: string;
      designation?: string;
      bio?: string;
      profileImage?: string;
      socialLinks?: {
        linkedin?: string;
        twitter?: string;
      };
    };
    role: string;
    assignedAt: Date;
  }>;
  hall?: {
    id: string;
    name: string;
    capacity: number;
    location?: string;
    equipment?: string[];
  };
  event: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  presentations: Array<{
    id: string;
    title: string;
    description?: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
    isApproved: boolean;
    user: { name: string; email: string };
  }>;
  attendanceRecords: Array<{
    id: string;
    userId: string;
    timestamp: Date;
    method: string;
    user: { name: string; email: string };
  }>;
  conflicts?: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
  }>;
  _count: {
    speakers: number;
    presentations: number;
    attendanceRecords: number;
    conflicts: number;
  };
}

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

const SPEAKER_ROLE_COLORS = {
  SPEAKER: 'bg-blue-100 text-blue-800',
  MODERATOR: 'bg-green-100 text-green-800',
  CHAIRPERSON: 'bg-purple-100 text-purple-800'
};

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  // State
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks
  const { data: sessionData, isLoading, error, refetch } = useSessionData(sessionId);
  
  const session = sessionData?.data as unknown as SessionDetails;

  // Get session status
  const getSessionStatus = () => {
    if (!session) return null;
    
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    if (now < startTime) return { 
      status: 'UPCOMING', 
      label: 'Upcoming', 
      color: 'bg-blue-100 text-blue-800', 
      icon: CalendarIcon 
    };
    if (now >= startTime && now <= endTime) return { 
      status: 'ONGOING', 
      label: 'Ongoing', 
      color: 'bg-green-100 text-green-800', 
      icon: PlayIcon 
    };
    return { 
      status: 'COMPLETED', 
      label: 'Completed', 
      color: 'bg-gray-100 text-gray-600', 
      icon: CheckCircleIcon 
    };
  };

  const sessionStatus = getSessionStatus();
  const duration = session ? differenceInMinutes(new Date(session.endTime), new Date(session.startTime)) : 0;
  const attendanceRate = session && session.maxParticipants 
    ? (session._count.attendanceRecords / session.maxParticipants) * 100 
    : 0;

  // Handle actions
  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this session?')) {
      // Implementation for delete
      console.log('Delete session:', sessionId);
    }
  };

  const handleDuplicate = () => {
    // Implementation for duplicate
    console.log('Duplicate session:', sessionId);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // Show toast notification
  };

  const handleExport = (format: string) => {
    // Implementation for export
    console.log('Export session as:', format);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="bg-white border-b h-16"></div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center py-8">
            <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Session Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The session you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeConfig = SESSION_TYPE_CONFIG[session.sessionType as keyof typeof SESSION_TYPE_CONFIG];
  const TypeIcon = typeConfig?.icon || CalendarIcon;
  const StatusIcon = sessionStatus?.icon || CalendarIcon;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.back()}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/event-manager">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/event-manager/sessions">Sessions</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{session.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.print()}>
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" onClick={handleShare}>
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Session
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Session Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={typeConfig?.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig?.label}
                        </Badge>
                        <Badge className={sessionStatus?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {sessionStatus?.label}
                        </Badge>
                        {session.isBreak && (
                          <Badge variant="outline">Break Session</Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl mb-2">{session.title}</CardTitle>
                      {session.description && (
                        <p className="text-gray-600">{session.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{format(new Date(session.startTime), 'EEEE, MMM dd')}</div>
                        <div className="text-sm text-gray-600">{format(new Date(session.startTime), 'yyyy')}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                        </div>
                        <div className="text-sm text-gray-600">{duration} minutes</div>
                      </div>
                    </div>
                    
                    {session.hall && (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{session.hall.name}</div>
                          <div className="text-sm text-gray-600">
                            {session.hall.location} • Cap: {session.hall.capacity}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {session.tags && session.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TagIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {session.requirements && session.requirements.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <SettingsIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Requirements</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conflicts Alert */}
              {session.conflicts && session.conflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Schedule Conflicts Detected:</strong> This session conflicts with {session.conflicts.length} other session(s).
                    <div className="mt-2">
                      {session.conflicts.map(conflict => (
                        <div key={conflict.id} className="text-sm">
                          • {conflict.title} ({format(new Date(conflict.startTime), 'HH:mm')} - {format(new Date(conflict.endTime), 'HH:mm')})
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="speakers">Speakers ({session._count.speakers})</TabsTrigger>
                  <TabsTrigger value="presentations">Presentations ({session._count.presentations})</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance ({session._count.attendanceRecords})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Event Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">{session.event.name}</h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(session.event.startDate), 'MMM dd')} - {format(new Date(session.event.endDate), 'MMM dd, yyyy')}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {session.event.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hall Details */}
                  {session.hall && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Venue Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium">Hall Name</span>
                              <p className="text-sm text-gray-600">{session.hall.name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Location</span>
                              <p className="text-sm text-gray-600">{session.hall.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Capacity</span>
                              <p className="text-sm text-gray-600">{session.hall.capacity} people</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Current Attendance</span>
                              <p className="text-sm text-gray-600">
                                {session._count.attendanceRecords} people ({attendanceRate.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                          
                          {session.hall.equipment && session.hall.equipment.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Available Equipment</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {session.hall.equipment.map((equipment, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {equipment}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="speakers" className="space-y-4">
                  {session.speakers.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No speakers assigned to this session</p>
                      </CardContent>
                    </Card>
                  ) : (
                    session.speakers.map((speaker) => (
                      <Card key={speaker.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={speaker.user.profileImage} />
                              <AvatarFallback>
                                {speaker.user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{speaker.user.name}</h4>
                                <Badge className={SPEAKER_ROLE_COLORS[speaker.role as keyof typeof SPEAKER_ROLE_COLORS]}>
                                  {speaker.role}
                                </Badge>
                              </div>
                              
                              {speaker.user.designation && (
                                <p className="text-sm text-gray-600">{speaker.user.designation}</p>
                              )}
                              
                              {speaker.user.institution && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <BuildingIcon className="h-3 w-3" />
                                  {speaker.user.institution}
                                </p>
                              )}

                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                {speaker.user.email && (
                                  <div className="flex items-center gap-1">
                                    <MailIcon className="h-3 w-3" />
                                    <a href={`mailto:${speaker.user.email}`} className="hover:text-blue-600">
                                      {speaker.user.email}
                                    </a>
                                  </div>
                                )}
                                
                                {speaker.user.phone && (
                                  <div className="flex items-center gap-1">
                                    <PhoneIcon className="h-3 w-3" />
                                    <span>{speaker.user.phone}</span>
                                  </div>
                                )}
                              </div>

                              {speaker.user.bio && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                  {speaker.user.bio}
                                </p>
                              )}

                              {speaker.user.socialLinks && (
                                <div className="flex items-center gap-2 mt-2">
                                  {speaker.user.socialLinks.linkedin && (
                                    <a 
                                      href={speaker.user.socialLinks.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                  {speaker.user.socialLinks.twitter && (
                                    <a 
                                      href={speaker.user.socialLinks.twitter}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="presentations">
                  {session.presentations.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No presentations uploaded yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Presentation</TableHead>
                              <TableHead>Uploaded By</TableHead>
                              <TableHead>File Size</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.presentations.map((presentation) => (
                              <TableRow key={presentation.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{presentation.title}</div>
                                    <div className="text-sm text-gray-600">
                                      {presentation.fileType.toUpperCase()} • {format(new Date(presentation.uploadedAt), 'MMM dd, yyyy')}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{presentation.user.name}</div>
                                    <div className="text-sm text-gray-600">{presentation.user.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {(presentation.fileSize / 1024 / 1024).toFixed(2)} MB
                                </TableCell>
                                <TableCell>
                                  <Badge variant={presentation.isApproved ? 'default' : 'secondary'}>
                                    {presentation.isApproved ? 'Approved' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <SettingsIcon className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem>
                                        <EyeIcon className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <DownloadIcon className="h-4 w-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="attendance">
                  {session.attendanceRecords.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No attendance records yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Participant</TableHead>
                              <TableHead>Check-in Time</TableHead>
                              <TableHead>Method</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.attendanceRecords.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{record.user.name}</div>
                                    <div className="text-sm text-gray-600">{record.user.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {record.method === 'QR_CODE' && <QrCodeIcon className="h-3 w-3 mr-1" />}
                                    {record.method}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Speakers</span>
                    <span className="font-medium">{session._count.speakers}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Presentations</span>
                    <span className="font-medium">{session._count.presentations}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Attendance</span>
                    <span className="font-medium">{session._count.attendanceRecords}</span>
                  </div>
                  
                  {session.maxParticipants && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <span className="font-medium">{session.maxParticipants}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Fill Rate</span>
                          <span className="font-medium">{attendanceRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={attendanceRate} className="h-2" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" onClick={handleEdit}>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit Session
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline" onClick={handleDuplicate}>
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Duplicate Session
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3Icon className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  
                  <Separator />
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Session
                  </Button>
                </CardContent>
              </Card>

              {/* Session Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Created: {format(new Date(session.startTime), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Starts: {format(new Date(session.startTime), 'MMM dd, HH:mm')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Ends: {format(new Date(session.endTime), 'MMM dd, HH:mm')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Duration: {duration} minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Edit Form Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
            </DialogHeader>
            <SessionForm
              eventId={session.event.id}
              session={session}
              halls={session.hall ? [session.hall] : []}
              onSuccess={(updatedSession) => {
                setShowEditForm(false);
                refetch();
              }}
              onCancel={() => setShowEditForm(false)}
              className="border-none shadow-none p-0"
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}