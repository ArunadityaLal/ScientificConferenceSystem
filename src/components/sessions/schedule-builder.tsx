'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, addMinutes, startOfDay, differenceInMinutes, isSameDay, parseISO } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  PresentationIcon
} from 'lucide-react';

import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge} from '@/components/ui';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

// Types
interface Hall {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[];
}

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
      name: string; 
      institution?: string;
    };
    role: string;
  }>;
  hall?: Hall;
  _count: {
    speakers: number;
    attendanceRecords: number;
  };
}

interface ScheduleBuilderProps {
  eventId: string;
  halls: Hall[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
  sessions?: Session[];
  onSessionClick?: (session: Session) => void;
  onSessionEdit?: (session: Session) => void;
  onSessionDelete?: (sessionId: string) => void;
  timeSlotDuration?: number; // in minutes
  startHour?: number;
  endHour?: number;
}

const SESSION_TYPE_COLORS = {
  KEYNOTE: 'bg-purple-100 text-purple-800 border-purple-300',
  PRESENTATION: 'bg-blue-100 text-blue-800 border-blue-300',
  PANEL: 'bg-green-100 text-green-800 border-green-300',
  WORKSHOP: 'bg-orange-100 text-orange-800 border-orange-300',
  POSTER: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  BREAK: 'bg-gray-100 text-gray-600 border-gray-300'
} as const;

export function ScheduleBuilder({ 
  eventId, 
  halls, 
  selectedDate, 
  onDateChange,
  className,
  sessions = [],
  onSessionClick,
  onSessionEdit,
  onSessionDelete,
  timeSlotDuration = 30,
  startHour = 8,
  endHour = 18
}: ScheduleBuilderProps) {
  const [draggedSession, setDraggedSession] = useState<Session | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ hallId: string; timeSlot: Date } | null>(null);

  // Filter sessions for selected date
  const daySession = useMemo(() => {
    return sessions.filter(session => 
      isSameDay(new Date(session.startTime), selectedDate)
    );
  }, [sessions, selectedDate]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    const startTime = startOfDay(selectedDate);
    startTime.setHours(startHour, 0, 0, 0);
    
    const totalMinutes = (endHour - startHour) * 60;
    const numberOfSlots = totalMinutes / timeSlotDuration;
    
    for (let i = 0; i < numberOfSlots; i++) {
      slots.push(addMinutes(startTime, i * timeSlotDuration));
    }
    
    return slots;
  }, [selectedDate, startHour, endHour, timeSlotDuration]);

  // Function to get session position and dimensions
  const getSessionStyle = (session: Session) => {
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    const dayStart = startOfDay(selectedDate);
    dayStart.setHours(startHour, 0, 0, 0);
    
    const startMinutes = differenceInMinutes(startTime, dayStart);
    const duration = differenceInMinutes(endTime, startTime);
    
    const top = (startMinutes / timeSlotDuration) * 60; // 60px per slot
    const height = (duration / timeSlotDuration) * 60;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, 40)}px`, // Minimum height
      zIndex: 10
    };
  };

  // Check for session conflicts
  const hasConflict = (session: Session) => {
    return daySession.some(otherSession => 
      otherSession.id !== session.id &&
      otherSession.hallId === session.hallId &&
      ((new Date(session.startTime) >= new Date(otherSession.startTime) && 
        new Date(session.startTime) < new Date(otherSession.endTime)) ||
       (new Date(session.endTime) > new Date(otherSession.startTime) && 
        new Date(session.endTime) <= new Date(otherSession.endTime)) ||
       (new Date(session.startTime) <= new Date(otherSession.startTime) && 
        new Date(session.endTime) >= new Date(otherSession.endTime)))
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, session: Session) => {
    setDraggedSession(session);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, hallId: string, timeSlot: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ hallId, timeSlot });
  };

  const handleDrop = (e: React.DragEvent, hallId: string, timeSlot: Date) => {
    e.preventDefault();
    if (draggedSession) {
      // Here you would update the session with new time and hall
      console.log('Moving session', draggedSession.id, 'to hall', hallId, 'at time', timeSlot);
    }
    setDraggedSession(null);
    setDragOverSlot(null);
  };

  const handleDragEnd = () => {
    setDraggedSession(null);
    setDragOverSlot(null);
  };

  // Session component
  const SessionBlock = ({ session }: { session: Session }) => {
    const conflict = hasConflict(session);
    const sessionTypeColor = SESSION_TYPE_COLORS[session.sessionType as keyof typeof SESSION_TYPE_COLORS] || SESSION_TYPE_COLORS.PRESENTATION;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, session)}
        onDragEnd={handleDragEnd}
        className={cn(
          "absolute left-1 right-1 bg-white border-l-4 rounded-md shadow-sm cursor-move",
          "hover:shadow-md transition-shadow duration-200",
          conflict ? "border-l-red-500 bg-red-50" : "border-l-blue-500",
          draggedSession?.id === session.id ? "opacity-50" : ""
        )}
        style={getSessionStyle(session)}
        onClick={() => onSessionClick?.(session)}
      >
        <div className="p-2 h-full flex flex-col">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-900 truncate">
                {session.title}
              </h4>
              <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                <ClockIcon className="h-3 w-3" />
                {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontalIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => onSessionEdit?.(session)}>
                  <EditIcon className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CopyIcon className="h-3 w-3 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onSessionDelete?.(session.id)}
                >
                  <TrashIcon className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
            <Badge variant="outline" className={cn("text-xs px-1 py-0", sessionTypeColor)}>
              {session.sessionType}
            </Badge>
            
            {session._count.speakers > 0 && (
              <div className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                <span>{session._count.speakers}</span>
              </div>
            )}
            
            {conflict && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangleIcon className="h-3 w-3 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  Schedule conflict detected
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (halls.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Halls Available
            </h3>
            <p className="text-gray-600">
              Add halls to your event to start building the schedule
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">
          Schedule for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
        </h2>
        <Badge variant="secondary">
          {daySession.length} sessions
        </Badge>
      </div>

      {/* Schedule Grid */}
      <div className="flex-1 border rounded-lg bg-white overflow-hidden">
        <div className="flex">
          {/* Time Column */}
          <div className="w-20 border-r bg-gray-50">
            <div className="h-12 border-b flex items-center justify-center text-xs font-medium text-gray-600">
              Time
            </div>
            <div className="relative">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.getTime()} className="h-15 border-b border-gray-200 flex items-start justify-center pt-1">
                  <span className="text-xs text-gray-600">
                    {format(timeSlot, 'HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Halls Columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex">
              {halls.map((hall) => (
                <div key={hall.id} className="flex-1 min-w-64 border-r last:border-r-0">
                  {/* Hall Header */}
                  <div className="h-12 border-b bg-gray-50 px-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{hall.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {hall.capacity}
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="relative">
                    {timeSlots.map((timeSlot) => (
                      <div 
                        key={timeSlot.getTime()}
                        className={cn(
                          "h-15 border-b border-gray-100 relative group",
                          dragOverSlot?.hallId === hall.id && 
                          dragOverSlot.timeSlot.getTime() === timeSlot.getTime() 
                            ? "bg-blue-50 border-blue-200" 
                            : "hover:bg-gray-50"
                        )}
                        onDragOver={(e) => handleDragOver(e, hall.id, timeSlot)}
                        onDrop={(e) => handleDrop(e, hall.id, timeSlot)}
                      >
                        {/* Drop zone indicator */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 border-2 border-dashed border-gray-300 m-1 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">Drop session here</span>
                        </div>
                      </div>
                    ))}

                    {/* Sessions */}
                    {daySession
                      .filter(session => session.hallId === hall.id)
                      .map((session) => (
                        <div key={session.id} className="group">
                          <SessionBlock session={session} />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Total Sessions: <strong>{daySession.length}</strong>
            </span>
            <span className="text-gray-600">
              Total Speakers: <strong>{daySession.reduce((acc, session) => acc + session._count.speakers, 0)}</strong>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {daySession.some(hasConflict) && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangleIcon className="h-3 w-3 mr-1" />
                Conflicts Detected
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Also export as default for compatibility
export default ScheduleBuilder;