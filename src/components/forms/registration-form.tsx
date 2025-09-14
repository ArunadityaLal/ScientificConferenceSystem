// src/components/forms/registration-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useCreateRegistration, useRegistrationEligibility } from '@/hooks/use-registrations';
import { useEvent } from '@/hooks/use-events';
import { useSessionsByEvent } from '@/hooks/use-sessions';
import { useAuth } from '@/hooks/use-auth';

import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Utensils, 
  AlertTriangle,
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  CreditCard,
  Shield,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

// Validation schema
const registrationSchema = z.object({
  participantType: z.enum(['DELEGATE', 'SPEAKER', 'SPONSOR', 'VOLUNTEER']).default('DELEGATE'),
  institution: z.string().optional(),
  designation: z.string().optional(),
  experience: z.number().min(0).optional(),
  specialization: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  sessionPreferences: z.array(z.string()).optional(),
  accommodationRequired: z.boolean().default(false),
  transportRequired: z.boolean().default(false),
  certificateRequired: z.boolean().default(true),
  additionalRequirements: z.string().optional(),
  consentForPhotography: z.boolean().default(false),
  consentForMarketing: z.boolean().default(false),
  // Payment information
  paymentMethod: z.enum(['ONLINE', 'OFFLINE', 'BANK_TRANSFER', 'CHEQUE', 'FREE']).optional(),
  // Terms and conditions
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the privacy policy"
  }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegistrationForm({ eventId, onSuccess, onCancel }: RegistrationFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form setup
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      participantType: 'DELEGATE',
      institution: '',
      designation: '',
      experience: undefined,
      specialization: '',
      dietaryRequirements: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      sessionPreferences: [],
      accommodationRequired: false,
      transportRequired: false,
      certificateRequired: true,
      additionalRequirements: '',
      consentForPhotography: false,
      consentForMarketing: false,
      paymentMethod: undefined,
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const { watch, setValue, getValues } = form;

  // Data fetching hooks
  const { data: event } = useEvent(eventId);
  const { data: sessions } = useSessionsByEvent(eventId);
  const { data: eligibility } = useRegistrationEligibility(eventId);

  // Mutations
  const createRegistration = useCreateRegistration();

  // Check if user is eligible
  const isEligible = eligibility?.data?.eligible ?? true;
  const eligibilityMessage = eligibility?.data?.message;

  // Get available sessions for preferences
  const availableSessions = sessions?.data?.sessions || [];

  // Handle session preference change
  const handleSessionPreferenceChange = (sessionId: string, checked: boolean) => {
    const current = getValues('sessionPreferences') || [];
    if (checked) {
      setValue('sessionPreferences', [...current, sessionId]);
    } else {
      setValue('sessionPreferences', current.filter(id => id !== sessionId));
    }
  };

  // Navigation
  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Form submission
  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const registrationData = {
        eventId,
        registrationData: {
          participantType: data.participantType,
          institution: data.institution || undefined,
          designation: data.designation || undefined,
          experience: data.experience || undefined,
          specialization: data.specialization || undefined,
          dietaryRequirements: data.dietaryRequirements || undefined,
          emergencyContact: data.emergencyContact?.name ? data.emergencyContact : undefined,
          sessionPreferences: data.sessionPreferences,
          accommodationRequired: data.accommodationRequired,
          transportRequired: data.transportRequired,
          certificateRequired: data.certificateRequired,
          additionalRequirements: data.additionalRequirements || undefined,
          consentForPhotography: data.consentForPhotography,
          consentForMarketing: data.consentForMarketing,
        },
        paymentInfo: data.paymentMethod ? {
          paymentMethod: data.paymentMethod,
          currency: 'INR',
        } : undefined,
      };

      await createRegistration.mutateAsync(registrationData);
      onSuccess?.();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const isLoading = createRegistration.isPending;

  // Show eligibility error
  if (!isEligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Registration Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {eligibilityMessage || "Registration is not available for this event."}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={onCancel}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event?.data ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{event.data.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(event.data.startDate), 'MMM dd, yyyy')} - {format(new Date(event.data.endDate), 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {event.data.location}
              </div>
              <Badge variant="outline">{event.data.eventType}</Badge>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 <= step ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    i + 1 < step ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Participant Type */}
              <div className="space-y-2">
                <Label htmlFor="participantType">Participant Type *</Label>
                <Select value={watch('participantType')} onValueChange={(value) => setValue('participantType', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELEGATE">Delegate</SelectItem>
                    <SelectItem value="SPEAKER">Speaker</SelectItem>
                    <SelectItem value="SPONSOR">Sponsor</SelectItem>
                    <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">Institution/Organization</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <Input
                    id="institution"
                    {...form.register('institution')}
                    placeholder="Your institution or organization"
                    className="rounded-l-none"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-2">
                <Label htmlFor="designation">Designation/Job Title</Label>
                <Input
                  id="designation"
                  {...form.register('designation')}
                  placeholder="Your current position"
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  {...form.register('experience', { valueAsNumber: true })}
                  placeholder="Years of relevant experience"
                />
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <Label htmlFor="specialization">Area of Specialization</Label>
                <Input
                  id="specialization"
                  {...form.register('specialization')}
                  placeholder="Your field of expertise"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Session Preferences */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select sessions you're most interested in attending (optional):
              </p>
              
              {availableSessions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableSessions.map((session) => (
                    <div key={session.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`session-${session.id}`}
                        checked={(watch('sessionPreferences') || []).includes(session.id)}
                        onCheckedChange={(checked) => handleSessionPreferenceChange(session.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`session-${session.id}`} className="text-sm font-medium cursor-pointer">
                          {session.title}
                        </label>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(session.startTime), 'MMM dd, HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {session.sessionType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Requirements */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Additional Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dietary Requirements */}
              <div className="space-y-2">
                <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                <Textarea
                  id="dietaryRequirements"
                  {...form.register('dietaryRequirements')}
                  placeholder="Any dietary restrictions, allergies, or special requirements"
                  rows={2}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    {...form.register('emergencyContact.name')}
                    placeholder="Contact name"
                  />
                  <Input
                    {...form.register('emergencyContact.phone')}
                    placeholder="Phone number"
                  />
                  <Input
                    {...form.register('emergencyContact.relationship')}
                    placeholder="Relationship"
                  />
                </div>
              </div>

              {/* Additional Requirements */}
              <div className="space-y-2">
                <Label htmlFor="additionalRequirements">Additional Requirements</Label>
                <Textarea
                  id="additionalRequirements"
                  {...form.register('additionalRequirements')}
                  placeholder="Any other special requirements or requests"
                  rows={3}
                />
              </div>

              {/* Service Preferences */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accommodationRequired"
                    checked={watch('accommodationRequired')}
                    onCheckedChange={(checked) => setValue('accommodationRequired', checked as boolean)}
                  />
                  <Label htmlFor="accommodationRequired">I need accommodation assistance</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transportRequired"
                    checked={watch('transportRequired')}
                    onCheckedChange={(checked) => setValue('transportRequired', checked as boolean)}
                  />
                  <Label htmlFor="transportRequired">I need transportation assistance</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="certificateRequired"
                    checked={watch('certificateRequired')}
                    onCheckedChange={(checked) => setValue('certificateRequired', checked as boolean)}
                  />
                  <Label htmlFor="certificateRequired">I want to receive a certificate</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Consent & Terms */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Consent & Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={watch('paymentMethod') || ''} onValueChange={(value) => setValue('paymentMethod', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free Registration</SelectItem>
                    <SelectItem value="ONLINE">Online Payment</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="OFFLINE">Pay at Venue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consentForPhotography"
                    checked={watch('consentForPhotography')}
                    onCheckedChange={(checked) => setValue('consentForPhotography', checked as boolean)}
                  />
                  <Label htmlFor="consentForPhotography" className="text-sm">
                    I consent to being photographed/videographed during the event for promotional purposes
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consentForMarketing"
                    checked={watch('consentForMarketing')}
                    onCheckedChange={(checked) => setValue('consentForMarketing', checked as boolean)}
                  />
                  <Label htmlFor="consentForMarketing" className="text-sm">
                    I consent to receiving marketing communications about future events
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={watch('termsAccepted')}
                    onCheckedChange={(checked) => setValue('termsAccepted', checked as boolean)}
                  />
                  <Label htmlFor="termsAccepted" className="text-sm">
                    I accept the <a href="#" className="text-primary underline">terms and conditions</a> *
                  </Label>
                </div>
                {form.formState.errors.termsAccepted && (
                  <p className="text-sm text-red-500">{form.formState.errors.termsAccepted.message}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacyAccepted"
                    checked={watch('privacyAccepted')}
                    onCheckedChange={(checked) => setValue('privacyAccepted', checked as boolean)}
                  />
                  <Label htmlFor="privacyAccepted" className="text-sm">
                    I accept the <a href="#" className="text-primary underline">privacy policy</a> *
                  </Label>
                </div>
                {form.formState.errors.privacyAccepted && (
                  <p className="text-sm text-red-500">{form.formState.errors.privacyAccepted.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            {step < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                Submit Registration
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}