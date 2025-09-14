// src/components/forms/attendance-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  useSessionAttendance, 
  useMarkAttendance, 
  useBulkMarkAttendance,
  useGenerateQR,
  useMarkAttendanceQR,
  useRealtimeAttendanceCount
} from '@/hooks/use-attendance';
import { useSessionsByEvent } from '@/hooks/use-sessions';
import { useRegistrationsByEvent } from '@/hooks/use-registrations';
import { useAuth } from '@/hooks/use-auth';

import { 
  UserCheck, 
  QrCode, 
  Users, 
  Search,
  CheckCircle,
  Clock,
  Camera,
  Scan,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';

// Validation schema for manual attendance
const attendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  selectedUsers: z.array(z.string()).min(1, 'At least one participant must be selected'),
  method: z.enum(['MANUAL', 'QR']).default('MANUAL'),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface AttendanceFormProps {
  eventId?: string;
  sessionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AttendanceForm({ eventId, sessionId: initialSessionId, onSuccess, onCancel }: AttendanceFormProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'qr' | 'bulk'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [qrToken, setQrToken] = useState('');

  // Form setup
  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      sessionId: initialSessionId || '',
      selectedUsers: [],
      method: 'MANUAL',
    },
  });

  const { watch, setValue, getValues } = form;
  const selectedSessionId = watch('sessionId');

  // Data fetching hooks
  const { data: sessions } = useSessionsByEvent(eventId || '');
  const { data: registrations } = useRegistrationsByEvent(eventId || '');
  const { data: sessionAttendance, refetch: refetchAttendance } = useSessionAttendance(selectedSessionId);
  const { data: attendanceCount } = useRealtimeAttendanceCount(selectedSessionId);

  // Mutations
  const markAttendance = useMarkAttendance();
  const bulkMarkAttendance = useBulkMarkAttendance();
  const generateQR = useGenerateQR();
  const markAttendanceQR = useMarkAttendanceQR();

  // Get available sessions (only ongoing or today's sessions)
  const availableSessions = sessions?.data?.sessions?.filter(session => {
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  }) || [];

  // Get registered participants for the event
  const registeredParticipants = registrations?.data?.registrations?.filter(
    reg => reg.status === 'APPROVED'
  ) || [];

  // Filter participants based on search
  const filteredParticipants = registeredParticipants.filter(reg =>
    reg.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.registrationData?.institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get already marked attendance
  const markedAttendance = sessionAttendance?.data?.attendanceRecords || [];
  const markedUserIds = markedAttendance.map(record => record.userId);

  // Get unmarked participants
  const unmarkedParticipants = filteredParticipants.filter(
    reg => !markedUserIds.includes(reg.user?.id || '')
  );

  // Generate QR code for session
  const handleGenerateQR = async () => {
    if (selectedSessionId) {
      try {
        const result = await generateQR.mutateAsync(selectedSessionId);
        setQrCode(result.data.qrCode);
      } catch (error) {
        console.error('QR generation error:', error);
      }
    }
  };

  // Mark attendance via QR
  const handleQRAttendance = async () => {
    if (qrToken.trim()) {
      try {
        await markAttendanceQR.mutateAsync(qrToken);
        setQrToken('');
        refetchAttendance();
      } catch (error) {
        console.error('QR attendance error:', error);
      }
    }
  };

  // Manual attendance marking
  const onSubmitManual = async (data: AttendanceFormData) => {
    try {
      if (data.selectedUsers.length === 1) {
        // Single user
        await markAttendance.mutateAsync({
          sessionId: data.sessionId,
          userId: data.selectedUsers[0]!,
          method: 'MANUAL',
        });
      } else {
        // Multiple users
        await bulkMarkAttendance.mutateAsync({
          sessionId: data.sessionId,
          userIds: data.selectedUsers,
          method: 'MANUAL',
        });
      }

      // Reset form
      setValue('selectedUsers', []);
      refetchAttendance();
      onSuccess?.();
    } catch (error) {
      console.error('Attendance marking error:', error);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const currentSelected = getValues('selectedUsers');
    if (currentSelected.includes(userId)) {
      setValue('selectedUsers', currentSelected.filter(id => id !== userId));
    } else {
      setValue('selectedUsers', [...currentSelected, userId]);
    }
  };

  // Select all unmarked participants
  const selectAll = () => {
    const allUnmarkedIds = unmarkedParticipants.map(p => p.user?.id).filter(Boolean) as string[];
    setValue('selectedUsers', allUnmarkedIds);
  };

  // Clear selection
  const clearSelection = () => {
    setValue('selectedUsers', []);
  };

  const isLoading = markAttendance.isPending || bulkMarkAttendance.isPending || markAttendanceQR.isPending;

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionId">Session *</Label>
              <Select value={selectedSessionId} onValueChange={(value) => setValue('sessionId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {availableSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title} - {format(new Date(session.startTime), 'HH:mm')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.sessionId && (
                <p className="text-sm text-red-500">{form.formState.errors.sessionId.message}</p>
              )}
            </div>

            {selectedSessionId && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Current Attendance</p>
                  <p className="text-sm text-muted-foreground">
                    {attendanceCount?.data?.count || 0} participants marked present
                  </p>
                </div>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {attendanceCount?.data?.count || 0}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSessionId && (
        <>
          {/* Method Selection Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={activeTab === 'manual' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('manual')}
                  className="flex-1"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manual
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'qr' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('qr')}
                  className="flex-1"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'bulk' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('bulk')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk
                </Button>
              </div>

              {/* Manual Attendance */}
              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {form.formState.errors.selectedUsers && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {form.formState.errors.selectedUsers.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={form.handleSubmit(onSubmitManual)}>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {unmarkedParticipants.length > 0 ? (
                        unmarkedParticipants.map((registration) => (
                          <div key={registration.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={watch('selectedUsers').includes(registration.user?.id || '')}
                              onCheckedChange={() => toggleUserSelection(registration.user?.id || '')}
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium">{registration.user?.name}</h5>
                              <p className="text-sm text-muted-foreground">
                                {registration.user?.email}
                                {registration.registrationData?.institution && (
                                  <> • {registration.registrationData.institution}</>
                                )}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {registration.registrationData.participantType}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {searchTerm ? 'No participants found matching your search' : 'All participants have been marked present'}
                          </p>
                        </div>
                      )}
                    </div>

                    {unmarkedParticipants.length > 0 && (
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex space-x-2">
                          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                            Select All
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                            Clear
                          </Button>
                        </div>
                        <Button type="submit" disabled={isLoading || watch('selectedUsers').length === 0}>
                          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                          Mark Present ({watch('selectedUsers').length})
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* QR Code Method */}
              {activeTab === 'qr' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Generate QR */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Generate QR Code</h4>
                      <Button
                        type="button"
                        onClick={handleGenerateQR}
                        disabled={generateQR.isPending}
                        className="w-full"
                      >
                        {generateQR.isPending ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <QrCode className="h-4 w-4 mr-2" />
                        )}
                        Generate QR Code
                      </Button>

                      {qrCode && (
                        <div className="border rounded-lg p-4 text-center">
                          <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center">
                            <QrCode className="h-24 w-24 text-gray-400" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Show this QR code to participants
                          </p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Scan QR */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Scan QR Code</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter QR token or scan code"
                          value={qrToken}
                          onChange={(e) => setQrToken(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Scan
                          </Button>
                          <Button
                            type="button"
                            onClick={handleQRAttendance}
                            disabled={!qrToken.trim() || isLoading}
                            className="flex-1"
                          >
                            {isLoading ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Mark Present
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Method */}
              {activeTab === 'bulk' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Bulk Operations</h4>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export List
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Mark all registered participants as present? This action cannot be undone.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      onClick={() => {
                        const allIds = registeredParticipants.map(p => p.user?.id).filter(Boolean) as string[];
                        bulkMarkAttendance.mutate({
                          sessionId: selectedSessionId,
                          userIds: allIds,
                          method: 'MANUAL',
                        });
                      }}
                      disabled={isLoading}
                      variant="default"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Mark All Present ({registeredParticipants.length})
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Attendance List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Current Attendance ({markedAttendance.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {markedAttendance.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {markedAttendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{record.user?.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {format(new Date(record.timestamp), 'HH:mm')}
                        </span>
                      </div>
                      <Badge variant={record.method === 'QR' ? 'default' : 'secondary'}>
                        {record.method}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attendance marked yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}