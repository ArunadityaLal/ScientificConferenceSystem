// import React, { useState, useEffect } from 'react';
// import { X, Search, Filter, Download, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// interface ApprovalFaculty {
//   id: string;
//   name: string;
//   email: string;
//   institution: string;
//   designation: string;
//   specialization: string;
//   phone: string;
//   sessionId: string;
//   sessionTitle: string;
//   eventId: string;
//   eventName: string;
//   responseStatus: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE';
//   responseDate: string | null;
//   responseMessage: string | null;
//   rejectionReason: string | null;
//   invitationDate: string;
//   daysPending?: number;
// }

// interface Event {
//   id: string;
//   name: string;
//   startDate: string;
//   endDate: string;
//   location: string;
//   totalInvitations: number;
//   acceptedCount: number;
//   declinedCount: number;
//   pendingCount: number;
// }

// interface Session {
//   id: string;
//   title: string;
//   startTime: string;
//   endTime: string;
//   hallName: string;
//   totalInvitations: number;
//   acceptedCount: number;
//   declinedCount: number;
//   pendingCount: number;
// }

// interface ApprovalsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   initialStatus: 'ACCEPTED' | 'DECLINED' | 'PENDING';
// }

// const ApprovalsModal: React.FC<ApprovalsModalProps> = ({ isOpen, onClose, initialStatus }) => {
//   const [currentStatus, setCurrentStatus] = useState<'ACCEPTED' | 'DECLINED' | 'PENDING'>(initialStatus);
//   const [events, setEvents] = useState<Event[]>([]);
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [facultyList, setFacultyList] = useState<ApprovalFaculty[]>([]);
//   const [selectedEventId, setSelectedEventId] = useState<string>('');
//   const [selectedSessionId, setSelectedSessionId] = useState<string>('');
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Fetch events on component mount
//   useEffect(() => {
//     if (isOpen) {
//       fetchEvents();
//     }
//   }, [isOpen]);

//   // Fetch sessions when event is selected
//   useEffect(() => {
//     if (selectedEventId) {
//       fetchSessions(selectedEventId);
//       fetchFacultyByEvent(selectedEventId, currentStatus);
//     }
//   }, [selectedEventId, currentStatus]);

//   // Fetch faculty when session is selected
//   useEffect(() => {
//     if (selectedSessionId) {
//       fetchFacultyBySession(selectedSessionId, currentStatus);
//     }
//   }, [selectedSessionId, currentStatus]);

//   const fetchEvents = async () => {
//     try {
//       const response = await fetch('/api/approvals?type=events');
//       const result = await response.json();
//       if (result.success) {
//         setEvents(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching events:', error);
//     }
//   };

//   const fetchSessions = async (eventId: string) => {
//     try {
//       const response = await fetch(`/api/approvals?type=sessions&eventId=${eventId}`);
//       const result = await response.json();
//       if (result.success) {
//         setSessions(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching sessions:', error);
//     }
//   };

//   const fetchFacultyByEvent = async (eventId: string, status: string) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`/api/approvals?type=faculty&eventId=${eventId}&status=${status}`);
//       const result = await response.json();
//       if (result.success) {
//         setFacultyList(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching faculty by event:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFacultyBySession = async (sessionId: string, status: string) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`/api/approvals?type=faculty&sessionId=${sessionId}&status=${status}`);
//       const result = await response.json();
//       if (result.success) {
//         setFacultyList(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching faculty by session:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = (status: 'ACCEPTED' | 'DECLINED' | 'PENDING') => {
//     setCurrentStatus(status);
//     setFacultyList([]);
//     if (selectedSessionId) {
//       fetchFacultyBySession(selectedSessionId, status);
//     } else if (selectedEventId) {
//       fetchFacultyByEvent(selectedEventId, status);
//     }
//   };

//   const handleEventChange = (eventId: string) => {
//     setSelectedEventId(eventId);
//     setSelectedSessionId('');
//     setSessions([]);
//     setFacultyList([]);
//   };

//   const handleSessionChange = (sessionId: string) => {
//     setSelectedSessionId(sessionId);
//     setFacultyList([]);
//   };

//   const filteredFaculty = facultyList.filter(faculty =>
//     faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     faculty.institution.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'ACCEPTED': return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case 'DECLINED': return <XCircle className="w-5 h-5 text-red-500" />;
//       case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
//       default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
//       case 'DECLINED': return 'bg-red-100 text-red-800 border-red-200';
//       case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       default: return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <Users className="w-6 h-6" />
//               <div>
//                 <h2 className="text-2xl font-bold">Faculty Approvals</h2>
//                 <p className="text-blue-100">Manage session invitations and responses</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="bg-gray-50 border-b p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//             {/* Event Selection */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Event *
//               </label>
//               <select
//                 value={selectedEventId}
//                 onChange={(e) => handleEventChange(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="">Choose an event</option>
//                 {events.map(event => (
//                   <option key={event.id} value={event.id}>
//                     {event.name} ({event.totalInvitations} invitations)
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Session Selection */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Session (Optional)
//               </label>
//               <select
//                 value={selectedSessionId}
//                 onChange={(e) => handleSessionChange(e.target.value)}
//                 disabled={!selectedEventId}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
//               >
//                 <option value="">All sessions</option>
//                 {sessions.map(session => (
//                   <option key={session.id} value={session.id}>
//                     {session.title} ({session.totalInvitations} invitations)
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Search */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Search Faculty
//               </label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="Search by name, email, or institution..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Status Tabs */}
//           <div className="flex space-x-1">
//             {['ACCEPTED', 'DECLINED', 'PENDING'].map(status => (
//               <button
//                 key={status}
//                 onClick={() => handleStatusChange(status as any)}
//                 className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                   currentStatus === status
//                     ? 'bg-blue-600 text-white'
//                     : 'bg-white text-gray-600 hover:bg-gray-100'
//                 }`}
//               >
//                 <div className="flex items-center space-x-2">
//                   {getStatusIcon(status)}
//                   <span>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 overflow-y-auto max-h-[60vh]">
//           {loading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <span className="ml-3 text-gray-600">Loading faculty data...</span>
//             </div>
//           ) : filteredFaculty.length === 0 ? (
//             <div className="text-center py-12">
//               <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">
//                 No faculty found
//               </h3>
//               <p className="text-gray-500">
//                 {!selectedEventId
//                   ? 'Please select an event to view faculty approvals'
//                   : `No faculty with ${currentStatus.toLowerCase()} status found for the selected criteria`
//                 }
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {/* Results Header */}
//               <div className="flex justify-between items-center">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   {filteredFaculty.length} Faculty {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
//                 </h3>
//                 <button
//                   onClick={() => {/* Export functionality */}}
//                   className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   <span>Export</span>
//                 </button>
//               </div>

//               {/* Faculty List */}
//               <div className="grid gap-4">
//                 {filteredFaculty.map(faculty => (
//                   <div key={faculty.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
//                     <div className="flex justify-between items-start mb-3">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-3 mb-2">
//                           <h4 className="text-lg font-semibold text-gray-900">{faculty.name}</h4>
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(faculty.responseStatus)}`}>
//                             {faculty.responseStatus}
//                           </span>
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
//                           <div>
//                             <p><strong>Email:</strong> {faculty.email}</p>
//                             <p><strong>Institution:</strong> {faculty.institution}</p>
//                             <p><strong>Designation:</strong> {faculty.designation}</p>
//                           </div>
//                           <div>
//                             <p><strong>Session:</strong> {faculty.sessionTitle}</p>
//                             <p><strong>Specialization:</strong> {faculty.specialization}</p>
//                             {faculty.phone && <p><strong>Phone:</strong> {faculty.phone}</p>}
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Response Details */}
//                     <div className="border-t pt-3 mt-3">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                         <div>
//                           <p className="text-gray-600">
//                             <strong>Invitation Sent:</strong> {new Date(faculty.invitationDate).toLocaleDateString()}
//                           </p>
//                           {faculty.responseDate && (
//                             <p className="text-gray-600">
//                               <strong>Response Date:</strong> {new Date(faculty.responseDate).toLocaleDateString()}
//                             </p>
//                           )}
//                           {faculty.daysPending && (
//                             <p className="text-yellow-600">
//                               <strong>Days Pending:</strong> {faculty.daysPending} days
//                             </p>
//                           )}
//                         </div>
//                         {(faculty.responseMessage || faculty.rejectionReason) && (
//                           <div>
//                             <p className="text-gray-700">
//                               <strong>
//                                 {currentStatus === 'DECLINED' ? 'Rejection Reason:' : 'Response Message:'}
//                               </strong>
//                             </p>
//                             <p className="text-gray-600 italic">
//                               "{faculty.responseMessage || faculty.rejectionReason}"
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ApprovalsModal;