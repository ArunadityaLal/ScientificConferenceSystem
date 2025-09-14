import React, { useState, useEffect } from 'react';
import { X, Download, Clock, Mail, Phone } from 'lucide-react';

interface ApprovalFaculty {
  id: string;
  name: string;
  email: string;
  institution: string;
  designation: string;
  specialization: string;
  phone: string;
  sessionId: string;
  sessionTitle: string;
  eventId: string;
  eventName: string;
  responseStatus: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE';
  responseDate: string | null;
  responseMessage: string | null;
  rejectionReason: string | null;
  invitationDate: string;
  daysPending?: number;
}

interface EventWithStats {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  totalInvitations: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  tentativeCount: number;
}

interface SessionWithStats {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hallName: string;
  totalInvitations: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  tentativeCount: number;
}

interface PendingFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PendingFacultyModal: React.FC<PendingFacultyModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [facultyList, setFacultyList] = useState<ApprovalFaculty[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting state...');
      setSelectedEventId('');
      setSelectedSessionId('');
      setSessions([]);
      setFacultyList([]);
      setError(null);
      setInitialLoad(true);
      fetchEvents();
    }
  }, [isOpen]);

  // When event is selected, fetch sessions only (not faculty)
  useEffect(() => {
    if (selectedEventId && !initialLoad) {
      console.log('Event selected:', selectedEventId);
      fetchSessions(selectedEventId);
      setFacultyList([]); // Clear faculty list when event changes
      setSelectedSessionId(''); // Reset session selection
    }
  }, [selectedEventId, initialLoad]);

  // When session is selected, fetch faculty for that session
  useEffect(() => {
    if (selectedSessionId && selectedEventId) {
      console.log('Session selected:', selectedSessionId);
      fetchFacultyBySession(selectedSessionId);
    }
  }, [selectedSessionId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching events...');
      
      const response = await fetch('/api/approvals?type=events');
      console.log('Events API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Events API result:', result);
      
      if (result.success) {
        setEvents(result.data);
        console.log('Events set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(`Failed to load events: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchSessions = async (eventId: string) => {
    try {
      console.log('Fetching sessions for event:', eventId);
      const response = await fetch(`/api/approvals?type=sessions&eventId=${eventId}`);
      console.log('Sessions API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Sessions API result:', result);
      
      if (result.success) {
        setSessions(result.data);
        console.log('Sessions set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fetchFacultyBySession = async (sessionId: string) => {
    setLoading(true);
    try {
      console.log('Fetching pending faculty for session:', sessionId);
      const response = await fetch(`/api/approvals?type=faculty&sessionId=${sessionId}&status=PENDING`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Faculty API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Faculty list set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty by session:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    console.log('Event changed to:', eventId);
    setSelectedEventId(eventId);
    setSelectedSessionId('');
    setSessions([]);
    setFacultyList([]);
    setError(null);
  };

  const handleSessionChange = (sessionId: string) => {
    console.log('Session changed to:', sessionId);
    setSelectedSessionId(sessionId);
  };

  const handleSendReminder = async (facultyId: string, facultyEmail: string) => {
    console.log('Sending reminder to:', facultyEmail);
    alert(`Reminder would be sent to ${facultyEmail}`);
  };

  const handleContact = (facultyPhone: string, facultyEmail: string) => {
    const mailtoLink = `mailto:${facultyEmail}?subject=Faculty Session Invitation Follow-up`;
    window.open(mailtoLink);
  };

  const handleExport = () => {
    if (facultyList.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Name', 'Email', 'Institution', 'Designation', 'Specialization', 'Phone', 'Session', 'Invitation Date', 'Days Pending'];
    const csvContent = [
      headers.join(','),
      ...facultyList.map(faculty => [
        `"${faculty.name}"`,
        `"${faculty.email}"`,
        `"${faculty.institution}"`,
        `"${faculty.designation}"`,
        `"${faculty.specialization}"`,
        `"${faculty.phone}"`,
        `"${faculty.sessionTitle}"`,
        `"${new Date(faculty.invitationDate).toLocaleDateString()}"`,
        `"${faculty.daysPending || 0}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pending-faculty-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Pending Faculty</h2>
                <p className="text-yellow-100">Faculty who haven't responded to session invitations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchEvents();
                  }}
                  className="text-red-600 hover:text-red-800 underline text-sm mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-50 border-b p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event *
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                disabled={loading && initialLoad}
              >
                <option value="">Choose an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.pendingCount} pending)
                  </option>
                ))}
              </select>
              {events.length === 0 && !loading && !error && (
                <p className="text-xs text-gray-500 mt-1">No events available</p>
              )}
            </div>

            {/* Session Selection with Export Button - DEBUG VERSION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session *
              </label>
              {/* Debug Info */}
              {/* <div className="text-xs text-gray-500 mb-1">
                Debug: {sessions.length} sessions found
                {selectedEventId && ` for event ${selectedEventId}`}
              </div> */}
              <div className="flex gap-2">
                <select
                  value={selectedSessionId}
                  onChange={(e) => {
                    console.log('Session selected:', e.target.value);
                    handleSessionChange(e.target.value);
                  }}
                  disabled={!selectedEventId || sessions.length === 0}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:bg-gray-100"
                >
                  <option value="">Choose a session ({sessions.length} available)</option>
                  {sessions.map(session => {
                    console.log('Rendering session option:', session);
                    return (
                      <option key={session.id} value={session.id}>
                        {session.title} ({session.pendingCount} pending)
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={handleExport}
                  disabled={facultyList.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
              {selectedEventId && sessions.length === 0 && !loading && (
                <p className="text-xs text-red-500 mt-1">No sessions available for this event</p>
              )}
              {/* Debug Sessions Data */}
              {/* {sessions.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Debug: View sessions data
                  </summary>
                  <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-32">
                    {JSON.stringify(sessions, null, 2)}
                  </pre>
                </details>
              )} */}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              <span className="ml-3 text-gray-600">
                {initialLoad ? 'Loading events...' : 'Loading pending faculty...'}
              </span>
            </div>
          ) : !selectedEventId ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select an Event
              </h3>
              <p className="text-gray-500">
                Please select an event to view sessions
              </p>
            </div>
          ) : !selectedSessionId ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Session
              </h3>
              <p className="text-gray-500">
                Please select a session to view pending faculty responses
              </p>
            </div>
          ) : facultyList.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending faculty found
              </h3>
              <p className="text-gray-500">
                No faculty have pending invitations for the selected session
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {facultyList.length} Pending Faculty
                  {selectedSessionId && sessions.find(s => s.id === selectedSessionId) && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      for "{sessions.find(s => s.id === selectedSessionId)?.title}"
                    </span>
                  )}
                </h3>
              </div>

              {/* Faculty List */}
              <div className="grid gap-4">
                {facultyList.map(faculty => (
                  <div key={faculty.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{faculty.name}</h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
                            PENDING
                          </span>
                          {faculty.daysPending && faculty.daysPending > 7 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              {faculty.daysPending} days overdue
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Email:</strong> {faculty.email}</p>
                            <p><strong>Institution:</strong> {faculty.institution}</p>
                            <p><strong>Designation:</strong> {faculty.designation}</p>
                          </div>
                          <div>
                            <p><strong>Session:</strong> {faculty.sessionTitle}</p>
                            <p><strong>Specialization:</strong> {faculty.specialization}</p>
                            {faculty.phone && <p><strong>Phone:</strong> {faculty.phone}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response Details */}
                    <div className="border-t pt-3 mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <strong>Invitation Sent:</strong> {new Date(faculty.invitationDate).toLocaleDateString()}
                          </p>
                          {faculty.daysPending && (
                            <p className={`${faculty.daysPending > 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                              <strong>Days Pending:</strong> {faculty.daysPending} days
                            </p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSendReminder(faculty.id, faculty.email)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Send Reminder</span>
                            </button>
                            <button
                              onClick={() => handleContact(faculty.phone, faculty.email)}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Contact</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingFacultyModal;