// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { 
//   Scan, 
//   UserCheck, 
//   AlertCircle, 
//   CheckCircle, 
//   Camera,
//   User,
//   Mail,
//   Smartphone,
//   RefreshCw,
//   ArrowLeft
// } from 'lucide-react';
// import QRScanner from '@/components/qr/qr-scanner';
// import { QRAttendanceData } from '@/lib/qr/generator';

// interface MobileScannerProps {
//   eventId?: string;
//   onBack?: () => void;
//   className?: string;
// }

// interface AttendanceResult {
//   success: boolean;
//   message: string;
//   sessionInfo?: {
//     id: string;
//     title: string;
//     hallName?: string;
//     eventName?: string;
//   };
//   attendanceTime?: string;
//   isUpdate?: boolean;
// }

// interface UserInfo {
//   name: string;
//   email: string;
// }

// export default function MobileScanner({ 
//   eventId, 
//   onBack, 
//   className = '' 
// }: MobileScannerProps) {
//   const [currentStep, setCurrentStep] = useState<'intro' | 'userInfo' | 'scanning' | 'result'>('intro');
//   const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '' });
//   const [attendanceResult, setAttendanceResult] = useState<AttendanceResult | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string>('');

//   // Auto-focus inputs on mobile
//   useEffect(() => {
//     if (currentStep === 'userInfo') {
//       const nameInput = document.getElementById('mobile-name-input');
//       if (nameInput) {
//         setTimeout(() => nameInput.focus(), 300);
//       }
//     }
//   }, [currentStep]);

//   const handleStartScanning = () => {
//     setError('');
//     setCurrentStep('userInfo');
//   };

//   const handleUserInfoSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!userInfo.name.trim() || !userInfo.email.trim()) {
//       setError('Please fill in all fields');
//       return;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(userInfo.email)) {
//       setError('Please enter a valid email address');
//       return;
//     }

//     setError('');
//     setCurrentStep('scanning');
//   };

//   const handleQRScanSuccess = async (qrData: QRAttendanceData) => {
//     setIsLoading(true);
    
//     try {
//       const response = await fetch('/api/attendance/qr', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           qrData: JSON.stringify(qrData),
//           userEmail: userInfo.email,
//           userName: userInfo.name,
//         }),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || 'Failed to mark attendance');
//       }

//       setAttendanceResult({
//         success: true,
//         message: result.data.message,
//         sessionInfo: result.data.sessionInfo,
//         attendanceTime: result.data.attendanceTime,
//         isUpdate: result.data.isUpdate
//       });

//     } catch (err) {
//       console.error('Attendance error:', err);
//       setAttendanceResult({
//         success: false,
//         message: err instanceof Error ? err.message : 'Failed to mark attendance'
//       });
//     } finally {
//       setIsLoading(false);
//       setCurrentStep('result');
//     }
//   };

//   const handleQRScanError = (error: string) => {
//     setAttendanceResult({
//       success: false,
//       message: error
//     });
//     setCurrentStep('result');
//   };

//   const resetScanner = () => {
//     setCurrentStep('intro');
//     setUserInfo({ name: '', email: '' });
//     setAttendanceResult(null);
//     setError('');
//   };

//   const scanAgain = () => {
//     setCurrentStep('scanning');
//     setAttendanceResult(null);
//     setError('');
//   };

//   // Intro Screen
//   if (currentStep === 'intro') {
//     return (
//       <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 ${className}`}>
//         <div className="max-w-sm mx-auto pt-8">
//           {onBack && (
//             <Button 
//               variant="ghost" 
//               onClick={onBack}
//               className="mb-4 p-0 h-auto text-blue-600"
//             >
//               <ArrowLeft className="h-4 w-4 mr-1" />
//               Back
//             </Button>
//           )}
          
//           <div className="text-center space-y-6">
//             <div className="relative">
//               <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
//                 <Scan className="h-12 w-12 text-blue-600" />
//               </div>
//               <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-200 rounded-full animate-ping"></div>
//             </div>

//             <div className="space-y-2">
//               <h1 className="text-2xl font-bold text-gray-900">
//                 QR Attendance
//               </h1>
//               <p className="text-gray-600 text-sm px-4">
//                 Scan the QR code displayed at your session to mark your attendance quickly and easily
//               </p>
//             </div>

//             <div className="space-y-3 bg-blue-50 p-4 rounded-lg text-left">
//               <div className="flex items-start gap-3">
//                 <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">Step 1: Enter Details</p>
//                   <p className="text-xs text-gray-600">Provide your name and email</p>
//                 </div>
//               </div>
              
//               <div className="flex items-start gap-3">
//                 <Camera className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">Step 2: Scan QR Code</p>
//                   <p className="text-xs text-gray-600">Point camera at the session QR code</p>
//                 </div>
//               </div>
              
//               <div className="flex items-start gap-3">
//                 <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">Step 3: Attendance Marked</p>
//                   <p className="text-xs text-gray-600">You'll get confirmation instantly</p>
//                 </div>
//               </div>
//             </div>

//             <Button 
//               onClick={handleStartScanning}
//               className="w-full h-12 text-lg font-medium"
//               size="lg"
//             >
//               <Scan className="h-5 w-5 mr-2" />
//               Start Scanning
//             </Button>

//             <p className="text-xs text-gray-500 px-4">
//               Make sure you have camera permission enabled in your browser settings
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // User Info Form
//   if (currentStep === 'userInfo') {
//     return (
//       <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 ${className}`}>
//         <div className="max-w-sm mx-auto pt-8">
//           <Button 
//             variant="ghost" 
//             onClick={() => setCurrentStep('intro')}
//             className="mb-4 p-0 h-auto text-blue-600"
//           >
//             <ArrowLeft className="h-4 w-4 mr-1" />
//             Back
//           </Button>

//           <div className="text-center mb-8">
//             <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
//               <User className="h-8 w-8 text-blue-600" />
//             </div>
//             <h2 className="text-xl font-bold text-gray-900">Your Information</h2>
//             <p className="text-gray-600 text-sm mt-2">
//               Please provide your details for attendance tracking
//             </p>
//           </div>

//           {error && (
//             <Alert className="mb-4 border-red-200 bg-red-50">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription className="text-red-700">
//                 {error}
//               </AlertDescription>
//             </Alert>
//           )}

//           <form onSubmit={handleUserInfoSubmit} className="space-y-4">
//             <div className="space-y-1">
//               <label htmlFor="mobile-name-input" className="text-sm font-medium text-gray-700">
//                 Full Name *
//               </label>
//               <Input
//                 id="mobile-name-input"
//                 type="text"
//                 placeholder="Enter your full name"
//                 value={userInfo.name}
//                 onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
//                 className="h-12 text-base"
//                 autoComplete="name"
//                 required
//               />
//             </div>

//             <div className="space-y-1">
//               <label htmlFor="mobile-email-input" className="text-sm font-medium text-gray-700">
//                 Email Address *
//               </label>
//               <Input
//                 id="mobile-email-input"
//                 type="email"
//                 placeholder="Enter your email address"
//                 value={userInfo.email}
//                 onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
//                 className="h-12 text-base"
//                 autoComplete="email"
//                 required
//               />
//             </div>

//             <div className="pt-4">
//               <Button 
//                 type="submit"
//                 className="w-full h-12 text-lg font-medium"
//                 size="lg"
//               >
//                 <Camera className="h-5 w-5 mr-2" />
//                 Continue to Scanner
//               </Button>
//             </div>
//           </form>

//           <div className="mt-6 p-3 bg-gray-50 rounded-lg">
//             <p className="text-xs text-gray-600 text-center">
//               <Smartphone className="h-3 w-3 inline mr-1" />
//               Your information is only used for attendance tracking and will not be shared
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Scanning Screen
//   if (currentStep === 'scanning') {
//     return (
//       <div className={`min-h-screen bg-black ${className}`}>
//         <div className="relative h-screen">
//           {/* Header */}
//           <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 text-white p-4">
//             <div className="flex items-center justify-between">
//               <Button 
//                 variant="ghost" 
//                 onClick={() => setCurrentStep('userInfo')}
//                 className="text-white hover:bg-white hover:bg-opacity-20 p-2"
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               <div className="text-center">
//                 <p className="font-medium">Scanning for QR Code</p>
//                 <p className="text-xs opacity-75">{userInfo.name}</p>
//               </div>
//               <div className="w-9"></div> {/* Spacer for center alignment */}
//             </div>
//           </div>

//           {/* Scanner */}
//           <div className="absolute inset-0 pt-16">
//             {isLoading ? (
//               <div className="h-full flex items-center justify-center bg-black">
//                 <div className="text-center text-white">
//                   <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
//                   <p className="text-lg font-medium">Marking Attendance...</p>
//                   <p className="text-sm opacity-75">Please wait</p>
//                 </div>
//               </div>
//             ) : (
//               <QRScanner
//                 onScanSuccess={handleQRScanSuccess}
//                 onScanError={handleQRScanError}
//                 className="h-full"
//               />
//             )}
//           </div>

//           {/* Instructions */}
//           <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center">
//             <p className="text-sm font-medium mb-1">Point your camera at the QR code</p>
//             <p className="text-xs opacity-75">Ensure the QR code is clearly visible and well-lit</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Result Screen
//   if (currentStep === 'result' && attendanceResult) {
//     return (
//       <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 ${className}`}>
//         <div className="max-w-sm mx-auto pt-8">
//           <div className="text-center space-y-6">
//             {/* Success/Error Icon */}
//             <div className="relative">
//               <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
//                 attendanceResult.success ? 'bg-green-100' : 'bg-red-100'
//               }`}>
//                 {attendanceResult.success ? (
//                   <CheckCircle className="h-12 w-12 text-green-600" />
//                 ) : (
//                   <AlertCircle className="h-12 w-12 text-red-600" />
//                 )}
//               </div>
//               {attendanceResult.success && (
//                 <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-green-200 rounded-full animate-ping"></div>
//               )}
//             </div>

//             {/* Message */}
//             <div className="space-y-2">
//               <h2 className={`text-xl font-bold ${
//                 attendanceResult.success ? 'text-green-900' : 'text-red-900'
//               }`}>
//                 {attendanceResult.success ? 'Attendance Marked!' : 'Scan Failed'}
//               </h2>
//               <p className={`text-sm ${
//                 attendanceResult.success ? 'text-green-700' : 'text-red-700'
//               }`}>
//                 {attendanceResult.message}
//               </p>
//             </div>

//             {/* Session Info (Success only) */}
//             {attendanceResult.success && attendanceResult.sessionInfo && (
//               <Card className="text-left bg-green-50 border-green-200">
//                 <CardContent className="p-4 space-y-2">
//                   <div className="flex justify-between items-start">
//                     <span className="text-sm font-medium text-gray-700">Session:</span>
//                     <span className="text-sm text-gray-900 text-right">
//                       {attendanceResult.sessionInfo.title}
//                     </span>
//                   </div>
//                   {attendanceResult.sessionInfo.hallName && (
//                     <div className="flex justify-between items-start">
//                       <span className="text-sm font-medium text-gray-700">Hall:</span>
//                       <span className="text-sm text-gray-900">
//                         {attendanceResult.sessionInfo.hallName}
//                       </span>
//                     </div>
//                   )}
//                   <div className="flex justify-between items-start">
//                     <span className="text-sm font-medium text-gray-700">Time:</span>
//                     <span className="text-sm text-gray-900">
//                       {attendanceResult.attendanceTime ? 
//                         new Date(attendanceResult.attendanceTime).toLocaleTimeString('en-IN', {
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         }) : 'Just now'
//                       }
//                     </span>
//                   </div>
//                   {attendanceResult.isUpdate && (
//                     <div className="pt-2 border-t border-green-200">
//                       <p className="text-xs text-green-700">
//                         Note: Your attendance was already recorded and has been updated.
//                       </p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             )}

//             {/* Action Buttons */}
//             <div className="space-y-3">
//               {attendanceResult.success ? (
//                 <>
//                   <Button 
//                     onClick={scanAgain}
//                     className="w-full h-12 text-lg font-medium"
//                     size="lg"
//                   >
//                     <Scan className="h-5 w-5 mr-2" />
//                     Scan Another QR Code
//                   </Button>
//                   <Button 
//                     variant="outline"
//                     onClick={resetScanner}
//                     className="w-full h-12 text-lg font-medium"
//                     size="lg"
//                   >
//                     Done
//                   </Button>
//                 </>
//               ) : (
//                 <>
//                   <Button 
//                     onClick={scanAgain}
//                     className="w-full h-12 text-lg font-medium"
//                     size="lg"
//                   >
//                     <RefreshCw className="h-5 w-5 mr-2" />
//                     Try Again
//                   </Button>
//                   <Button 
//                     variant="outline"
//                     onClick={resetScanner}
//                     className="w-full h-12 text-lg font-medium"
//                     size="lg"
//                   >
//                     Start Over
//                   </Button>
//                 </>
//               )}
//             </div>

//             {/* User Info Display */}
//             <div className="pt-4 border-t border-gray-200">
//               <p className="text-xs text-gray-600">
//                 Signed in as: <strong>{userInfo.name}</strong> ({userInfo.email})
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }