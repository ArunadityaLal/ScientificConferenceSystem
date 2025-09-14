// src/components/reports/session-analytics.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Award, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Download,
  Share2,
  Calendar,
  MapPin,
  Search,
  Filter,
  BarChart3,
  Target,
  Zap,
  Heart
} from 'lucide-react';

// Interfaces
interface SessionMetrics {
  id: string;
  sessionName: string;
  faculty: string;
  facultyImage?: string;
  hall: string;
  date: string;
  time: string;
  duration: number; // in minutes
  capacity: number;
  registered: number;
  attended: number;
  avgRating: number;
  totalRatings: number;
  engagement: number; // 0-100
  satisfaction: number; // 0-100
  knowledgeGain: number; // 0-100
  relevance: number; // 0-100
  presentation: number; // 0-100
  interaction: number; // 0-100
  comments: number;
  positiveComments: number;
  negativeComments: number;
  keyTopics: string[];
  popularityScore: number;
  retentionRate: number; // percentage who stayed till end
}

interface FeedbackComment {
  id: string;
  sessionId: string;
  attendee: string;
  rating: number;
  comment: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  helpful: number;
}

interface TopicAnalysis {
  topic: string;
  mentions: number;
  sentiment: number; // -1 to 1
  sessions: string[];
}

interface FacultyComparison {
  faculty: string;
  avgRating: number;
  totalSessions: number;
  avgAttendance: number;
  avgEngagement: number;
  totalFeedback: number;
}

// Mock Data
const mockSessionMetrics: SessionMetrics[] = [
  {
    id: '1',
    sessionName: 'AI in Healthcare: Future Perspectives',
    faculty: 'Dr. Sarah Johnson',
    facultyImage: '/avatars/sarah-johnson.jpg',
    hall: 'Main Auditorium',
    date: '2025-07-14',
    time: '09:00 AM',
    duration: 90,
    capacity: 500,
    registered: 485,
    attended: 467,
    avgRating: 4.8,
    totalRatings: 423,
    engagement: 94,
    satisfaction: 96,
    knowledgeGain: 92,
    relevance: 95,
    presentation: 98,
    interaction: 87,
    comments: 156,
    positiveComments: 142,
    negativeComments: 8,
    keyTopics: ['AI', 'Healthcare', 'Machine Learning', 'Ethics'],
    popularityScore: 96,
    retentionRate: 91
  },
  {
    id: '2',
    sessionName: 'Machine Learning in Medical Diagnosis',
    faculty: 'Prof. Michael Chen',
    facultyImage: '/avatars/michael-chen.jpg',
    hall: 'Tech Hall A',
    date: '2025-07-14',
    time: '10:30 AM',
    duration: 75,
    capacity: 200,
    registered: 189,
    attended: 175,
    avgRating: 4.6,
    totalRatings: 168,
    engagement: 89,
    satisfaction: 91,
    knowledgeGain: 94,
    relevance: 93,
    presentation: 88,
    interaction: 92,
    comments: 98,
    positiveComments: 87,
    negativeComments: 5,
    keyTopics: ['Machine Learning', 'Diagnosis', 'Deep Learning', 'Data'],
    popularityScore: 89,
    retentionRate: 88
  },
  {
    id: '3',
    sessionName: 'Telemedicine: Bridging Distance in Healthcare',
    faculty: 'Dr. Emily Davis',
    facultyImage: '/avatars/emily-davis.jpg',
    hall: 'Medical Hall B',
    date: '2025-07-14',
    time: '02:00 PM',
    duration: 60,
    capacity: 300,
    registered: 267,
    attended: 245,
    avgRating: 4.7,
    totalRatings: 234,
    engagement: 91,
    satisfaction: 93,
    knowledgeGain: 89,
    relevance: 96,
    presentation: 94,
    interaction: 85,
    comments: 123,
    positiveComments: 112,
    negativeComments: 4,
    keyTopics: ['Telemedicine', 'Remote Care', 'Technology', 'Access'],
    popularityScore: 91,
    retentionRate: 92
  }
];

const mockFeedbackComments: FeedbackComment[] = [
  {
    id: '1',
    sessionId: '1',
    attendee: 'Dr. Anderson',
    rating: 5,
    comment: 'Excellent presentation! Very insightful content about AI applications in healthcare.',
    timestamp: '2025-07-14 10:30:00',
    sentiment: 'positive',
    helpful: 23
  },
  {
    id: '2',
    sessionId: '1',
    attendee: 'Nurse Williams',
    rating: 4,
    comment: 'Great session, but could use more practical examples.',
    timestamp: '2025-07-14 10:45:00',
    sentiment: 'positive',
    helpful: 18
  },
  {
    id: '3',
    sessionId: '2',
    attendee: 'Dr. Brown',
    rating: 5,
    comment: 'Outstanding technical depth and clear explanations.',
    timestamp: '2025-07-14 11:45:00',
    sentiment: 'positive',
    helpful: 31
  }
];

const mockTopicAnalysis: TopicAnalysis[] = [
  { topic: 'AI/Machine Learning', mentions: 156, sentiment: 0.8, sessions: ['AI in Healthcare', 'ML in Diagnosis'] },
  { topic: 'Healthcare Innovation', mentions: 134, sentiment: 0.7, sessions: ['Telemedicine', 'Digital Health'] },
  { topic: 'Ethics & Privacy', mentions: 89, sentiment: 0.6, sessions: ['AI Ethics', 'Data Privacy'] },
  { topic: 'Implementation Challenges', mentions: 67, sentiment: 0.3, sessions: ['Digital Transformation'] },
  { topic: 'Cost Effectiveness', mentions: 45, sentiment: 0.5, sessions: ['Health Economics'] }
];

const mockFacultyComparison: FacultyComparison[] = [
  { faculty: 'Dr. Sarah Johnson', avgRating: 4.8, totalSessions: 5, avgAttendance: 94, avgEngagement: 94, totalFeedback: 567 },
  { faculty: 'Prof. Michael Chen', avgRating: 4.6, totalSessions: 4, avgAttendance: 89, avgEngagement: 89, totalFeedback: 445 },
  { faculty: 'Dr. Emily Davis', avgRating: 4.7, totalSessions: 6, avgAttendance: 91, avgEngagement: 91, totalFeedback: 623 },
  { faculty: 'Dr. Robert Wilson', avgRating: 4.5, totalSessions: 3, avgAttendance: 87, avgEngagement: 86, totalFeedback: 298 }
];

interface SessionAnalyticsProps {
  eventId?: string;
}

export default function SessionAnalytics({ eventId }: SessionAnalyticsProps) {
  const [selectedSession, setSelectedSession] = useState<SessionMetrics | null>(mockSessionMetrics[0] ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [filterRating, setFilterRating] = useState('all');

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalSessions = mockSessionMetrics.length;
    const avgRating = mockSessionMetrics.reduce((sum, s) => sum + s.avgRating, 0) / totalSessions;
    const avgAttendance = mockSessionMetrics.reduce((sum, s) => sum + (s.attended / s.capacity * 100), 0) / totalSessions;
    const avgEngagement = mockSessionMetrics.reduce((sum, s) => sum + s.engagement, 0) / totalSessions;
    const totalFeedback = mockSessionMetrics.reduce((sum, s) => sum + s.comments, 0);
    const avgSatisfaction = mockSessionMetrics.reduce((sum, s) => sum + s.satisfaction, 0) / totalSessions;

    return {
      totalSessions,
      avgRating,
      avgAttendance,
      avgEngagement,
      totalFeedback,
      avgSatisfaction
    };
  }, []);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = mockSessionMetrics.filter(session => 
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.faculty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterRating !== 'all') {
      const minRating = parseFloat(filterRating);
      filtered = filtered.filter(session => session.avgRating >= minRating);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.avgRating - a.avgRating;
        case 'attendance':
          return (b.attended / b.capacity) - (a.attended / a.capacity);
        case 'engagement':
          return b.engagement - a.engagement;
        case 'popularity':
        default:
          return b.popularityScore - a.popularityScore;
      }
    });
  }, [searchTerm, sortBy, filterRating]);

  // Prepare radar chart data for selected session
  const radarData = selectedSession ? [
    { subject: 'Satisfaction', A: selectedSession.satisfaction },
    { subject: 'Knowledge Gain', A: selectedSession.knowledgeGain },
    { subject: 'Relevance', A: selectedSession.relevance },
    { subject: 'Presentation', A: selectedSession.presentation },
    { subject: 'Interaction', A: selectedSession.interaction },
    { subject: 'Engagement', A: selectedSession.engagement }
  ] : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights for each session</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Share2 className="w-4 h-4 mr-2" />
            Share Insights
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Sessions</p>
                <p className="text-2xl font-bold">{overallStats.totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Avg Rating</p>
                <p className="text-2xl font-bold">{overallStats.avgRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Avg Attendance</p>
                <p className="text-2xl font-bold">{overallStats.avgAttendance.toFixed(1)}%</p>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Engagement</p>
                <p className="text-2xl font-bold">{overallStats.avgEngagement.toFixed(1)}%</p>
              </div>
              <Zap className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Feedback</p>
                <p className="text-2xl font-bold">{overallStats.totalFeedback}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Satisfaction</p>
                <p className="text-2xl font-bold">{overallStats.avgSatisfaction.toFixed(1)}%</p>
              </div>
              <Heart className="w-8 h-8 text-pink-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search sessions or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity Score</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Session Performance</TabsTrigger>
          <TabsTrigger value="comparison">Faculty Comparison</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
          <TabsTrigger value="topics">Topic Trends</TabsTrigger>
        </TabsList>

        {/* Session Performance */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>Click to view detailed analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedSession?.id === session.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{session.sessionName}</h4>
                          <p className="text-xs text-gray-600 mt-1">{session.faculty}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              ⭐ {session.avgRating}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round((session.attended / session.capacity) * 100)}% Full
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <div className="lg:col-span-2 space-y-4">
              {selectedSession && (
                <>
                  {/* Session Header */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold mb-2">{selectedSession.sessionName}</h2>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {selectedSession.faculty}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {selectedSession.hall}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {selectedSession.time} ({selectedSession.duration}min)
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{selectedSession.avgRating}</p>
                              <p className="text-sm text-gray-600">Average Rating</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">
                                {Math.round((selectedSession.attended / selectedSession.capacity) * 100)}%
                              </p>
                              <p className="text-sm text-gray-600">Attendance Rate</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-600">{selectedSession.engagement}%</p>
                              <p className="text-sm text-gray-600">Engagement Score</p>
                            </div>
                          </div>
                        </div>
                        
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedSession.facultyImage} />
                          <AvatarFallback>
                            {selectedSession.faculty.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>Multi-dimensional performance analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar
                            name="Score"
                            dataKey="A"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Key Topics & Feedback Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedSession.keyTopics.map((topic, index) => (
                            <Badge key={index} variant="secondary">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Feedback Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <ThumbsUp className="w-4 h-4 text-green-600" />
                              Positive
                            </span>
                            <span className="font-semibold">{selectedSession.positiveComments}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <ThumbsDown className="w-4 h-4 text-red-600" />
                              Negative
                            </span>
                            <span className="font-semibold">{selectedSession.negativeComments}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              Total Comments
                            </span>
                            <span className="font-semibold">{selectedSession.comments}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Faculty Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faculty Performance Comparison</CardTitle>
              <CardDescription>Comparative analysis of faculty performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockFacultyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="faculty" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgRating" fill="#3b82f6" name="Avg Rating" />
                  <Bar dataKey="avgEngagement" fill="#10b981" name="Avg Engagement" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockFacultyComparison.map((faculty, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg mb-3">{faculty.faculty}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg Rating:</span>
                      <Badge variant="secondary">{faculty.avgRating}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-semibold">{faculty.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendance:</span>
                      <span className="font-semibold">{faculty.avgAttendance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement:</span>
                      <span className="font-semibold">{faculty.avgEngagement}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feedback:</span>
                      <span className="font-semibold">{faculty.totalFeedback}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feedback Analysis */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest comments and ratings from attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFeedbackComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{comment.attendee}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < comment.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge 
                            variant={comment.sentiment === 'positive' ? 'default' : 
                                   comment.sentiment === 'negative' ? 'destructive' : 'secondary'}
                          >
                            {comment.sentiment}
                          </Badge>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{comment.timestamp}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.helpful} helpful
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic Trends */}
        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Topics</CardTitle>
              <CardDescription>Most discussed topics across sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTopicAnalysis.map((topic, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{topic.topic}</h4>
                      <Badge variant={topic.sentiment > 0.6 ? 'default' : topic.sentiment > 0.3 ? 'secondary' : 'destructive'}>
                        Sentiment: {(topic.sentiment * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Mentions: {topic.mentions}</span>
                      <div className="flex gap-1">
                        {topic.sessions.map((session, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {session}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Progress value={(topic.sentiment + 1) * 50} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}