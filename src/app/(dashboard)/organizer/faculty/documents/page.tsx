// src/app/(dashboard)/organizer/faculty/documents/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  Eye,
  Users,
  Calendar,
  Mail,
  Building2,
  RefreshCw,
  Search,
  Filter,
  FileImage,
  AlertCircle
} from "lucide-react";

type Event = {
  id: string;
  name: string;
  location: string;
  status: string;
};

type Session = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  place: string;
};

type Faculty = {
  id: string;
  name: string;
  email: string;
  institution?: string;
  designation?: string;
  sessionTitle: string;
  inviteStatus: string;
  presentation?: {
    id: string;
    fileName: string;
    fileSize: string;
    uploadedAt: string;
    fileUrl: string;
  };
  cv?: {
    id: string;
    fileName: string;
    fileSize: string;
    uploadedAt: string;
    fileUrl: string;
  };
};

const FacultyDocumentsPage: React.FC = () => {
  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Load sessions when event changes
  useEffect(() => {
    if (selectedEventId) {
      loadSessions(selectedEventId);
      setSelectedSessionId("");
      setFaculties([]);
    } else {
      setSessions([]);
      setSelectedSessionId("");
      setFaculties([]);
    }
  }, [selectedEventId]);

  // Load faculty documents when session changes
  useEffect(() => {
    if (selectedEventId && selectedSessionId) {
      loadFacultyDocuments(selectedEventId, selectedSessionId);
    } else {
      setFaculties([]);
    }
  }, [selectedEventId, selectedSessionId]);

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        const eventsArray = data.data?.events || data.events || data || [];
        setEvents(eventsArray);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const loadSessions = async (eventId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        const sessionsArray = data.data?.sessions || data.sessions || data || [];
        setSessions(sessionsArray);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyDocuments = async (eventId: string, sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/faculty/documents?eventId=${eventId}&sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setFaculties(data.data || []);
      }
    } catch (error) {
      console.error("Error loading faculty documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED DOWNLOAD FUNCTION - Uses database IDs
  const downloadFile = async (fileId: string, fileType: 'cv' | 'presentation', fileName: string) => {
    try {
      console.log(`Downloading file: ${fileId}, type: ${fileType}, name: ${fileName}`);
      
      const downloadUrl = `/api/faculty/download?fileId=${encodeURIComponent(fileId)}&type=${fileType}&name=${encodeURIComponent(fileName)}`;
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Successfully downloaded: ${fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // FIXED VIEW FUNCTION - Uses database IDs
  const viewFile = (fileId: string, fileType: 'cv' | 'presentation') => {
    const viewUrl = `/api/faculty/download?fileId=${encodeURIComponent(fileId)}&type=${fileType}&name=preview`;
    window.open(viewUrl, '_blank');
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter faculties based on search term
  const filteredFaculties = faculties.filter(faculty =>
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Faculty Documents
                </h1>
                <p className="text-gray-300 text-lg mt-1">
                  View and download faculty presentations and CVs
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Select Event
                    </label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex flex-col">
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-gray-400">{event.location}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Select Session
                    </label>
                    <Select 
                      value={selectedSessionId} 
                      onValueChange={setSelectedSessionId}
                      disabled={!selectedEventId || sessions.length === 0}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder={
                          !selectedEventId ? "Select an event first" : 
                          sessions.length === 0 ? "No sessions available" : 
                          "Choose a session"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex flex-col">
                              <div className="font-medium">{session.title}</div>
                              <div className="text-xs text-gray-400">
                                {session.place} • {new Date(session.startTime).toLocaleDateString()}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selected Info */}
                {selectedEvent && selectedSession && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-300">
                          {selectedEvent.name} → {selectedSession.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedSession.place} • {formatDate(selectedSession.startTime)}
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        {filteredFaculties.length} Faculty
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          {faculties.length > 0 && (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search faculty by name, email, or institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="text-sm text-gray-400">
                    {filteredFaculties.length} of {faculties.length} faculty
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Area */}
          {loading ? (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
                <div className="text-xl text-gray-300 mb-2">Loading Faculty Documents</div>
                <div className="text-gray-400">Please wait while we fetch the documents...</div>
              </CardContent>
            </Card>
          ) : !selectedEventId || !selectedSessionId ? (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Filter className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                <div className="text-2xl font-semibold text-gray-300 mb-3">Select Event and Session</div>
                <div className="text-gray-400 max-w-md mx-auto">
                  Choose an event and session from the dropdowns above to view faculty documents for that session.
                </div>
              </CardContent>
            </Card>
          ) : filteredFaculties.length === 0 ? (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                <div className="text-2xl font-semibold text-gray-300 mb-3">No Faculty Found</div>
                <div className="text-gray-400 max-w-md mx-auto">
                  {faculties.length === 0 
                    ? "No accepted faculty found for this session."
                    : "No faculty match your search criteria."
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredFaculties.map((faculty) => (
                <Card key={faculty.id} className="border-gray-700 bg-gray-900/50 backdrop-blur">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white">{faculty.name}</CardTitle>
                        <div className="text-sm text-gray-400 mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {faculty.email}
                          </div>
                          {faculty.institution && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {faculty.institution}
                            </div>
                          )}
                          {faculty.designation && (
                            <div className="text-xs text-gray-500">{faculty.designation}</div>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {faculty.inviteStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Session Info */}
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-300">Session Assignment</div>
                      <div className="text-xs text-gray-400 mt-1">{faculty.sessionTitle}</div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-3">
                      {/* Presentation */}
                      <div className="p-3 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium text-gray-300">Presentation</span>
                          </div>
                        </div>
                        {faculty.presentation ? (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-400">
                              {faculty.presentation.fileName} • {formatFileSize(faculty.presentation.fileSize)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Uploaded: {formatDate(faculty.presentation.uploadedAt)}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewFile(faculty.presentation!.id, 'presentation')}
                                className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(faculty.presentation!.id, 'presentation', faculty.presentation!.fileName)}
                                className="border-green-600 text-green-400 hover:bg-green-900/20"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <AlertCircle className="h-3 w-3" />
                            No presentation uploaded
                          </div>
                        )}
                      </div>

                      {/* CV */}
                      <div className="p-3 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-medium text-gray-300">CV</span>
                          </div>
                        </div>
                        {faculty.cv ? (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-400">
                              {faculty.cv.fileName} • {formatFileSize(faculty.cv.fileSize)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Uploaded: {formatDate(faculty.cv.uploadedAt)}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewFile(faculty.cv!.id, 'cv')}
                                className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(faculty.cv!.id, 'cv', faculty.cv!.fileName)}
                                className="border-green-600 text-green-400 hover:bg-green-900/20"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <AlertCircle className="h-3 w-3" />
                            No CV uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default FacultyDocumentsPage;