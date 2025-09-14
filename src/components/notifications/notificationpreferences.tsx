// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import { 
//   Bell, 
//   Mail, 
//   MessageSquare, 
//   Smartphone, 
//   Volume2, 
//   VolumeX,
//   Settings,
//   CheckCircle,
//   AlertCircle,
//   Info,
//   Bell,
//   Save,
//   RefreshCw
// } from 'lucide-react';
// import { usePushNotifications, useCommunicationPreferences } from '@/hooks/use-notifications';

// interface NotificationPreferencesProps {
//   userId: string;
//   onPreferencesChanged?: (preferences: any) => void;
//   className?: string;
// }

// interface NotificationCategory {
//   id: string;
//   name: string;
//   description: string;
//   icon: React.ReactNode;
//   preferences: {
//     email: boolean;
//     whatsapp: boolean;
//     push: boolean;
//   };
// }

// export default function NotificationPreferences({ 
//   userId, 
//   onPreferencesChanged, 
//   className = '' 
// }: NotificationPreferencesProps) {
//   const {
//     permissionState,
//     requestPermission,
//     testNotification,
//     isGranted,
//     isDenied,
//     canRequest
//   } = usePushNotifications();

//   const { preferences, updatePreferences } = useCommunicationPreferences(userId);
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string>('');
//   const [success, setSuccess] = useState<string>('');
//   const [isTesting, setIsTesting] = useState(false);

//   // Notification categories with their current settings
//   const [categories, setCategories] = useState<NotificationCategory[]>([
//     {
//       id: 'sessionReminders',
//       name: 'Session Reminders',
//       description: 'Get notified 30 minutes before your sessions start',
//       icon: <Bell className="h-5 w-5" />,
//       preferences: {
//         email: preferences.emailNotifications && preferences.sessionReminders,
//         whatsapp: preferences.whatsappNotifications && preferences.sessionReminders,
//         push: preferences.pushNotifications && preferences.sessionReminders,
//       }
//     },
//     {
//       id: 'eventUpdates',
//       name: 'Event Updates',
//       description: 'Schedule changes, venue updates, and important announcements',
//       icon: <Info className="h-5 w-5" />,
//       preferences: {
//         email: preferences.emailNotifications && preferences.eventUpdates,
//         whatsapp: preferences.whatsappNotifications && preferences.eventUpdates,
//         push: preferences.pushNotifications && preferences.eventUpdates,
//       }
//     },
//     {
//       id: 'certificateReady',
//       name: 'Certificates',
//       description: 'When your participation certificates are ready for download',
//       icon: <CheckCircle className="h-5 w-5" />,
//       preferences: {
//         email: preferences.emailNotifications,
//         whatsapp: preferences.whatsappNotifications,
//         push: preferences.pushNotifications,
//       }
//     },
//     {
//       id: 'generalCommunication',
//       name: 'General Communication',
//       description: 'Welcome messages, confirmations, and system notifications',
//       icon: <MessageSquare className="h-5 w-5" />,
//       preferences: {
//         email: preferences.emailNotifications,
//         whatsapp: preferences.whatsappNotifications,
//         push: preferences.pushNotifications,
//       }
//     },
//     {
//       id: 'marketingEmails',
//       name: 'Marketing & Promotions',
//       description: 'Information about future events and promotional content',
//       icon: <Mail className="h-5 w-5" />,
//       preferences: {
//         email: preferences.marketingEmails,
//         whatsapp: false, // Marketing not allowed via WhatsApp
//         push: false, // Marketing not via push notifications
//       }
//     }
//   ]);

//   // Update categories when preferences change
//   useEffect(() => {
//     setCategories(prev => prev.map(category => ({
//       ...category,
//       preferences: {
//         email: getEmailPreference(category.id),
//         whatsapp: getWhatsAppPreference(category.id),
//         push: getPushPreference(category.id),
//       }
//     })));
//   }, [preferences]);

//   const getEmailPreference = (categoryId: string): boolean => {
//     switch (categoryId) {
//       case 'marketingEmails':
//         return preferences.marketingEmails;
//       case 'sessionReminders':
//         return preferences.emailNotifications && preferences.sessionReminders;
//       case 'eventUpdates':
//         return preferences.emailNotifications && preferences.eventUpdates;
//       default:
//         return preferences.emailNotifications;
//     }
//   };

//   const getWhatsAppPreference = (categoryId: string): boolean => {
//     if (categoryId === 'marketingEmails') return false; // No marketing via WhatsApp
    
//     switch (categoryId) {
//       case 'sessionReminders':
//         return preferences.whatsappNotifications && preferences.sessionReminders;
//       case 'eventUpdates':
//         return preferences.whatsappNotifications && preferences.eventUpdates;
//       default:
//         return preferences.whatsappNotifications;
//     }
//   };

//   const getPushPreference = (categoryId: string): boolean => {
//     if (categoryId === 'marketingEmails') return false; // No marketing via push
    
//     switch (categoryId) {
//       case 'sessionReminders':
//         return preferences.pushNotifications && preferences.sessionReminders;
//       case 'eventUpdates':
//         return preferences.pushNotifications && preferences.eventUpdates;
//       default:
//         return preferences.pushNotifications;
//     }
//   };

//   const handleCategoryToggle = async (
//     categoryId: string, 
//     notificationType: 'email' | 'whatsapp' | 'push', 
//     enabled: boolean
//   ) => {
//     setError('');
    
//     try {
//       let updatedPreferences: any = {};

//       if (notificationType === 'email') {
//         if (categoryId === 'marketingEmails') {
//           updatedPreferences.marketingEmails = enabled;
//         } else {
//           updatedPreferences.emailNotifications = enabled;
//           if (categoryId === 'sessionReminders') {
//             updatedPreferences.sessionReminders = enabled;
//           } else if (categoryId === 'eventUpdates') {
//             updatedPreferences.eventUpdates = enabled;
//           }
//         }
//       } else if (notificationType === 'whatsapp') {
//         updatedPreferences.whatsappNotifications = enabled;
//         if (categoryId === 'sessionReminders') {
//           updatedPreferences.sessionReminders = enabled;
//         } else if (categoryId === 'eventUpdates') {
//           updatedPreferences.eventUpdates = enabled;
//         }
//       } else if (notificationType === 'push') {
//         updatedPreferences.pushNotifications = enabled;
//         if (categoryId === 'sessionReminders') {
//           updatedPreferences.sessionReminders = enabled;
//         } else if (categoryId === 'eventUpdates') {
//           updatedPreferences.eventUpdates = enabled;
//         }
//       }

//       await updatePreferences(updatedPreferences);
      
//       if (onPreferencesChanged) {
//         onPreferencesChanged(updatedPreferences);
//       }

//     } catch (error) {
//       setError('Failed to update preferences. Please try again.');
//       console.error('Preference update error:', error);
//     }
//   };

//   const handleRequestPushPermission = async () => {
//     setIsLoading(true);
//     setError('');
    
//     try {
//       const permission = await requestPermission();
      
//       if (permission === 'granted') {
//         setSuccess('Push notifications enabled successfully!');
//         // Auto-enable push notifications in preferences
//         await updatePreferences({ pushNotifications: true });
//       } else if (permission === 'denied') {
//         setError('Push notifications were denied. You can enable them in your browser settings.');
//       }
//     } catch (error) {
//       setError('Failed to request notification permission.');
//       console.error('Permission request error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleTestNotification = async () => {
//     setIsTesting(true);
//     setError('');
    
//     try {
//       const result = await testNotification();
      
//       if (result) {
//         setSuccess('Test notification sent! Check if you received it.');
//       } else {
//         setError('Failed to send test notification. Make sure notifications are enabled.');
//       }
//     } catch (error) {
//       setError('Failed to send test notification.');
//       console.error('Test notification error:', error);
//     } finally {
//       setIsTesting(false);
//     }
//   };

//   const saveAllPreferences = async () => {
//     setIsLoading(true);
//     setError('');
    
//     try {
//       // This would save all current preferences
//       await updatePreferences(preferences);
//       setSuccess('All preferences saved successfully!');
      
//       if (onPreferencesChanged) {
//         onPreferencesChanged(preferences);
//       }
//     } catch (error) {
//       setError('Failed to save preferences.');
//       console.error('Save preferences error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getPushNotificationStatus = () => {
//     if (!permissionState.isSupported) {
//       return {
//         status: 'not-supported',
//         message: 'Push notifications are not supported in this browser',
//         color: 'text-gray-500',
//         icon: <VolumeX className="h-4 w-4" />
//       };
//     }

//     if (isGranted) {
//       return {
//         status: 'enabled',
//         message: 'Push notifications are enabled',
//         color: 'text-green-600',
//         icon: <Volume2 className="h-4 w-4" />
//       };
//     }

//     if (isDenied) {
//       return {
//         status: 'denied',
//         message: 'Push notifications are blocked. Enable in browser settings.',
//         color: 'text-red-600',
//         icon: <VolumeX className="h-4 w-4" />
//       };
//     }

//     return {
//       status: 'default',
//       message: 'Push notifications permission not requested',
//       color: 'text-yellow-600',
//       icon: <Bell className="h-4 w-4" />
//     };
//   };

//   const pushStatus = getPushNotificationStatus();

//   return (
//     <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
//       {/* Header */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Settings className="h-5 w-5" />
//             Notification Preferences
//           </CardTitle>
//           <p className="text-sm text-gray-600">
//             Manage how and when you want to receive notifications
//           </p>
//         </CardHeader>
//       </Card>

//       {/* Status Alerts */}
//       {error && (
//         <Alert className="border-red-200 bg-red-50">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription className="text-red-700">
//             {error}
//           </AlertDescription>
//         </Alert>
//       )}

//       {success && (
//         <Alert className="border-green-200 bg-green-50">
//           <CheckCircle className="h-4 w-4" />
//           <AlertDescription className="text-green-700">
//             {success}
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Push Notification Setup */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base flex items-center gap-2">
//             <Smartphone className="h-5 w-5" />
//             Push Notifications Setup
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="space-y-1">
//               <div className="flex items-center gap-2">
//                 {pushStatus.icon}
//                 <span className={`text-sm font-medium ${pushStatus.color}`}>
//                   {pushStatus.message}
//                 </span>
//               </div>
//               <p className="text-xs text-gray-500">
//                 Browser notifications appear even when the site is closed
//               </p>
//             </div>
            
//             <div className="flex gap-2">
//               {canRequest && (
//                 <Button 
//                   onClick={handleRequestPushPermission}
//                   disabled={isLoading}
//                   size="sm"
//                 >
//                   {isLoading ? (
//                     <RefreshCw className="h-4 w-4 animate-spin mr-2" />
//                   ) : (
//                     <Bell className="h-4 w-4 mr-2" />
//                   )}
//                   Enable Push
//                 </Button>
//               )}
              
//               {isGranted && (
//                 <Button 
//                   variant="outline"
//                   onClick={handleTestNotification}
//                   disabled={isTesting}
//                   size="sm"
//                 >
//                   {isTesting ? (
//                     <RefreshCw className="h-4 w-4 animate-spin mr-2" />
//                   ) : (
//                     <Bell className="h-4 w-4 mr-2" />
//                   )}
//                   Test
//                 </Button>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Notification Categories */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base">Notification Categories</CardTitle>
//           <p className="text-sm text-gray-600">
//             Choose how you want to receive different types of notifications
//           </p>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Header Row */}
//           <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-600">
//             <div className="col-span-6">Category</div>
//             <div className="col-span-2 text-center">
//               <Mail className="h-4 w-4 mx-auto mb-1" />
//               Email
//             </div>
//             <div className="col-span-2 text-center">
//               <MessageSquare className="h-4 w-4 mx-auto mb-1" />
//               WhatsApp
//             </div>
//             <div className="col-span-2 text-center">
//               <Smartphone className="h-4 w-4 mx-auto mb-1" />
//               Push
//             </div>
//           </div>

//           <Separator />

//           {/* Category Rows */}
//           {categories.map((category, index) => (
//             <div key={category.id}>
//               <div className="grid grid-cols-12 gap-4 items-center">
//                 <div className="col-span-6">
//                   <div className="flex items-start gap-3">
//                     <div className="text-blue-600 mt-1">
//                       {category.icon}
//                     </div>
//                     <div>
//                       <div className="font-medium">{category.name}</div>
//                       <p className="text-sm text-gray-600 mt-1">
//                         {category.description}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="col-span-2 text-center">
//                   <Switch
//                     checked={category.preferences.email}
//                     onCheckedChange={(checked) => 
//                       handleCategoryToggle(category.id, 'email', checked)
//                     }
//                     disabled={category.id === 'marketingEmails' ? false : !preferences.emailNotifications}
//                   />
//                 </div>

//                 <div className="col-span-2 text-center">
//                   <Switch
//                     checked={category.preferences.whatsapp}
//                     onCheckedChange={(checked) => 
//                       handleCategoryToggle(category.id, 'whatsapp', checked)
//                     }
//                     disabled={
//                       category.id === 'marketingEmails' || 
//                       !preferences.whatsappNotifications
//                     }
//                   />
//                 </div>

//                 <div className="col-span-2 text-center">
//                   <Switch
//                     checked={category.preferences.push}
//                     onCheckedChange={(checked) => 
//                       handleCategoryToggle(category.id, 'push', checked)
//                     }
//                     disabled={
//                       category.id === 'marketingEmails' || 
//                       !preferences.pushNotifications ||
//                       !isGranted
//                     }
//                   />
//                 </div>
//               </div>

//               {index < categories.length - 1 && <Separator className="mt-6" />}
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* Global Settings */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base">Global Settings</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <Label className="text-base">Master Email Notifications</Label>
//               <p className="text-sm text-gray-600">
//                 Turn off all email notifications
//               </p>
//             </div>
//             <Switch
//               checked={preferences.emailNotifications}
//               onCheckedChange={(checked) => 
//                 updatePreferences({ emailNotifications: checked })
//               }
//             />
//           </div>

//           <Separator />

//           <div className="flex items-center justify-between">
//             <div>
//               <Label className="text-base">WhatsApp Notifications</Label>
//               <p className="text-sm text-gray-600">
//                 Receive notifications via WhatsApp Business
//               </p>
//             </div>
//             <Switch
//               checked={preferences.whatsappNotifications}
//               onCheckedChange={(checked) => 
//                 updatePreferences({ whatsappNotifications: checked })
//               }
//             />
//           </div>

//           <Separator />

//           <div className="flex items-center justify-between">
//             <div>
//               <Label className="text-base">Browser Push Notifications</Label>
//               <p className="text-sm text-gray-600">
//                 Real-time notifications in your browser
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge 
//                 variant={isGranted ? "default" : "secondary"}
//                 className={isGranted ? "bg-green-500" : ""}
//               >
//                 {pushStatus.status}
//               </Badge>
//               <Switch
//                 checked={preferences.pushNotifications && isGranted}
//                 onCheckedChange={(checked) => 
//                   updatePreferences({ pushNotifications: checked })
//                 }
//                 disabled={!isGranted}
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Save Button */}
//       <div className="flex justify-end">
//         <Button 
//           onClick={saveAllPreferences}
//           disabled={isLoading}
//           className="min-w-32"
//         >
//           {isLoading ? (
//             <RefreshCw className="h-4 w-4 animate-spin mr-2" />
//           ) : (
//             <Save className="h-4 w-4 mr-2" />
//           )}
//           Save All
//         </Button>
//       </div>
//     </div>
//   );
// }