'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LoadingButton,
  InlineAlert,
  SuccessAlert,
  ErrorAlert
} from '@/components/ui'
import { 
  Upload, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  Plane,
  Hotel,
  Monitor
} from 'lucide-react'

// Form validation schema
const facultyFormSchema = z.object({
  // Personal Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  designation: z.string().min(2, 'Designation is required'),
  institution: z.string().min(2, 'Institution is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  
  // Session Details
  sessionRole: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']),
  sessionTitle: z.string().optional(),
  presentationTitle: z.string().optional(),
  
  // Travel Details
  travelMode: z.enum(['BUS', 'TRAIN', 'FLIGHT', 'CAR', 'OTHER']),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  
  // Accommodation
  accommodationRequired: z.boolean().default(false),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  roomPreference: z.enum(['SINGLE', 'DOUBLE', 'SUITE']).optional(),
  specialRequirements: z.string().optional(),
  
  // Additional Information
  dietaryRestrictions: z.string().optional(),
  emergencyContact: z.string().optional(),
  previousParticipation: z.boolean().default(false),
  
  // Agreement
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
})

type FacultyFormData = z.infer<typeof facultyFormSchema>

interface FacultyFormProps {
  onSubmit?: (data: FacultyFormData) => void
  defaultValues?: Partial<FacultyFormData>
  isEdit?: boolean
}

export function FacultyForm({ onSubmit, defaultValues, isEdit = false }: FacultyFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [presentationFile, setPresentationFile] = useState<File | null>(null)
  const [itineraryFile, setItineraryFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      accommodationRequired: false,
      previousParticipation: false,
      agreeToTerms: false,
      ...defaultValues
    }
  })

  const accommodationRequired = watch('accommodationRequired')
  const sessionRole = watch('sessionRole')

  const handleFormSubmit = async (data: FacultyFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const formData = {
        ...data,
        cvFile,
        presentationFile,
        itineraryFile
      }
      
      onSubmit?.(formData)
      setSuccess(true)
      
      // Reset form if not editing
      if (!isEdit) {
        setCvFile(null)
        setPresentationFile(null)
        setItineraryFile(null)
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file: File, type: 'cv' | 'presentation' | 'itinerary') => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    const allowedTypes = {
      cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      presentation: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      itinerary: ['application/pdf', 'image/jpeg', 'image/png']
    }

    if (!allowedTypes[type].includes(file.type)) {
      setError(`Invalid file type for ${type}`)
      return
    }

    switch (type) {
      case 'cv':
        setCvFile(file)
        break
      case 'presentation':
        setPresentationFile(file)
        break
      case 'itinerary':
        setItineraryFile(file)
        break
    }
  }

  if (success && !isEdit) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <SuccessAlert title="Registration Successful!">
            Your faculty registration has been submitted successfully. You will receive a confirmation email shortly.
          </SuccessAlert>
          <Button 
            onClick={() => setSuccess(false)} 
            className="mt-4"
          >
            Register Another Faculty
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <ErrorAlert title="Error" onClose={() => setError('')}>
          {error}
        </ErrorAlert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Please provide your personal and professional details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Dr. John Doe"
                  {...register('name')}
                />
                {errors.name && (
                  <InlineAlert type="error" message={errors.name.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@university.edu"
                  {...register('email')}
                />
                {errors.email && (
                  <InlineAlert type="error" message={errors.email.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  {...register('phone')}
                />
                {errors.phone && (
                  <InlineAlert type="error" message={errors.phone.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  placeholder="Professor, Associate Professor, etc."
                  {...register('designation')}
                />
                {errors.designation && (
                  <InlineAlert type="error" message={errors.designation.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution *</Label>
                <Input
                  id="institution"
                  placeholder="University/Hospital Name"
                  {...register('institution')}
                />
                {errors.institution && (
                  <InlineAlert type="error" message={errors.institution.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  placeholder="Cardiology, Neurology, etc."
                  {...register('specialization')}
                />
                {errors.specialization && (
                  <InlineAlert type="error" message={errors.specialization.message || ''} />
                )}
              </div>
            </div>

            {/* CV Upload */}
            <div className="space-y-2">
              <Label>CV Upload</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-600">
                  {cvFile ? (
                    <p className="text-green-600">✓ {cvFile.name}</p>
                  ) : (
                    <p>Drop your CV here or <span className="text-blue-600 cursor-pointer">browse files</span></p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'cv')
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Session Information
            </CardTitle>
            <CardDescription>
              Details about your participation in the conference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionRole">Role in Session *</Label>
                <Select onValueChange={(value) => setValue('sessionRole', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPEAKER">Speaker</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                    <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sessionRole && (
                  <InlineAlert type="error" message={errors.sessionRole.message || ''} />
                )}
              </div>

              {sessionRole === 'SPEAKER' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTitle">Session Title</Label>
                    <Input
                      id="sessionTitle"
                      placeholder="Session topic or theme"
                      {...register('sessionTitle')}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="presentationTitle">Presentation Title</Label>
                    <Input
                      id="presentationTitle"
                      placeholder="Title of your presentation"
                      {...register('presentationTitle')}
                    />
                  </div>

                  {/* Presentation Upload */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Presentation Upload</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <div className="text-sm text-gray-600">
                        {presentationFile ? (
                          <p className="text-green-600">✓ {presentationFile.name}</p>
                        ) : (
                          <p>Drop your presentation here or <span className="text-blue-600 cursor-pointer">browse files</span></p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">PDF, PPT, PPTX up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'presentation')
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Travel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Travel Information
            </CardTitle>
            <CardDescription>
              Please provide your travel details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="travelMode">Mode of Travel *</Label>
                <Select onValueChange={(value) => setValue('travelMode', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLIGHT">Flight</SelectItem>
                    <SelectItem value="TRAIN">Train</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.travelMode && (
                  <InlineAlert type="error" message={errors.travelMode.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Arrival Date</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  {...register('arrivalDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input
                  id="departureDate"
                  type="date"
                  {...register('departureDate')}
                />
              </div>
            </div>

            {/* Travel Document Upload */}
            <div className="space-y-2">
              <Label>Travel Itinerary & Ticket</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-600">
                  {itineraryFile ? (
                    <p className="text-green-600">✓ {itineraryFile.name}</p>
                  ) : (
                    <p>Drop your travel documents here or <span className="text-blue-600 cursor-pointer">browse files</span></p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'itinerary')
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Accommodation
            </CardTitle>
            <CardDescription>
              Let us know about your accommodation needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="accommodationRequired"
                type="checkbox"
                className="rounded"
                {...register('accommodationRequired')}
              />
              <Label htmlFor="accommodationRequired">
                I require accommodation assistance
              </Label>
            </div>

            {accommodationRequired && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="checkInDate">Check-in Date</Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    {...register('checkInDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutDate">Check-out Date</Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    {...register('checkOutDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomPreference">Room Preference</Label>
                  <Select onValueChange={(value) => setValue('roomPreference', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single Room</SelectItem>
                      <SelectItem value="DOUBLE">Double Room</SelectItem>
                      <SelectItem value="SUITE">Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="specialRequirements">Special Requirements</Label>
                  <Textarea
                    id="specialRequirements"
                    placeholder="Any special accommodation requirements..."
                    {...register('specialRequirements')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  placeholder="Any dietary restrictions or food allergies..."
                  {...register('dietaryRestrictions')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Textarea
                  id="emergencyContact"
                  placeholder="Name and phone number of emergency contact..."
                  {...register('emergencyContact')}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="previousParticipation"
                type="checkbox"
                className="rounded"
                {...register('previousParticipation')}
              />
              <Label htmlFor="previousParticipation">
                I have participated in previous conferences by this organization
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Submit */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start space-x-2">
              <input
                id="agreeToTerms"
                type="checkbox"
                className="rounded mt-1"
                {...register('agreeToTerms')}
              />
              <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                I agree to the <span className="text-blue-600 cursor-pointer">terms and conditions</span> and confirm that all information provided is accurate to the best of my knowledge.
              </Label>
            </div>
            {errors.agreeToTerms && (
              <InlineAlert type="error" message={errors.agreeToTerms.message || ''} />
            )}

            <div className="flex gap-4 pt-4">
              <LoadingButton
                type="submit"
                loading={isLoading}
                className="flex-1"
              >
                {isEdit ? 'Update Registration' : 'Submit Registration'}
              </LoadingButton>
              
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>

      </form>
    </div>
  )
}