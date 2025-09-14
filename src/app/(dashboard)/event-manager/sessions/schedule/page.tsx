// src/app/(dashboard)/event-manager/sessions/schedule/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { 
  CalendarIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ArrowLeftIcon,
  SettingsIcon
} from 'lucide-react';

import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge
} from '@/components/ui';

// Temporary minimal ScheduleBuilder component
const SimpleScheduleBuilder = ({ eventId, selectedDate }: { eventId: string; selectedDate: Date }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Schedule for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Schedule Builder
            </h3>
            <p className="text-gray-600">
              Event: {eventId}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Schedule builder will be implemented here
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SessionsSchedulePage() {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock events data - replace with your actual hook later
  const events = [
    {
      id: 'evt_1',
      name: 'Scientific Conference 2025',
      startDate: '2025-08-25',
      endDate: '2025-08-31'
    }
  ];

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div>
              <h1 className="text-xl font-semibold">Schedule Builder</h1>
              <p className="text-sm text-gray-600">
                {selectedEvent ? 'Manage session scheduling' : 'Select an event to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>

            <Button
              size="sm"
              disabled={!selectedEvent}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Event Selector */}
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-3">
              {/* Date Navigation */}
              <div className="flex items-center gap-2 border rounded px-3 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" className="font-medium">
                  {format(selectedDate, 'EEEE, MMM dd, yyyy')}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedEvent ? (
          <div className="p-4 h-full">
            <SimpleScheduleBuilder
              eventId={selectedEvent}
              selectedDate={selectedDate}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="w-96">
              <CardHeader className="text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <CardTitle>No Event Selected</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Select an event from the dropdown above to start building your schedule.
                </p>
                {events.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No events available. Create an event first.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}