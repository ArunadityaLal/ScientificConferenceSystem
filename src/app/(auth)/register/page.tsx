"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LoadingButton,
  ErrorAlert,
  SuccessAlert,
  InlineAlert,
} from "@/components/ui";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  // Phone,
  Calendar,
  ArrowLeft,
  Chrome,
  Building,
  MessageSquare,
  ShieldCheck,
  Clock,
  RefreshCw,
} from "lucide-react";

// UserRole enum
enum UserRole {
  ORGANIZER = "ORGANIZER",
  EVENT_MANAGER = "EVENT_MANAGER",
  FACULTY = "FACULTY",
  DELEGATE = "DELEGATE",
  HALL_COORDINATOR = "HALL_COORDINATOR",
  SPONSOR = "SPONSOR",
  VOLUNTEER = "VOLUNTEER",
  VENDOR = "VENDOR",
}

// Registration steps enum
enum RegistrationStep {
  DETAILS = "details",
  OTP_VERIFICATION = "otp_verification",
  SUCCESS = "success",
}

// FIXED: Registration form validation schema without phone
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    // phone: z.string().min(10, "Phone number must be at least 10 digits"),
    role: z.nativeEnum(UserRole),
    institution: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// OTP Input Component
interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length,
  value,
  onChange,
  disabled = false,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));

  useEffect(() => {
    setOtp(value.split("").concat(Array(length - value.length).fill("")));
  }, [value, length]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    const otpValue = newOtp.join("");
    onChange(otpValue);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
    return true;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const target = e.target as HTMLInputElement;

    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      onChange(newOtp.join(""));

      // Focus previous input
      if (target.previousSibling && target.value === "") {
        (target.previousSibling as HTMLInputElement).focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .slice(0, length)
      .split("");
    const newOtp = [...otp];

    pasteData.forEach((char, index) => {
      if (index < length && !isNaN(Number(char))) {
        newOtp[index] = char;
      }
    });

    setOtp(newOtp);
    onChange(newOtp.join(""));
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={data}
          className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
};

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(
    RegistrationStep.DETAILS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP related states - FIXED: Only email OTP
  const [emailOtp, setEmailOtp] = useState("");
  // const [phoneOtp, setPhoneOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendEmail, setCanResendEmail] = useState(false);
  // const [canResendPhone, setCanResendPhone] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<RegisterFormData | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  // const [isResendingPhone, setIsResendingPhone] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const selectedRole = watch("role");

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpTimer > 0) {
      timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
    } else if (
      otpTimer === 0 &&
      currentStep === RegistrationStep.OTP_VERIFICATION
    ) {
      setCanResendEmail(true);
      // setCanResendPhone(true);
    }
    return () => clearTimeout(timer);
  }, [otpTimer, currentStep]);

  // FIXED: Handle initial form submission (step 1) - Email only
  const onSubmitDetails = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Sending OTP to:", {
        email: data.email,
        // phone: data.phone,
      });

      // Store registration data for later use
      setRegistrationData(data);

      // FIXED: Send OTP to email only
      const otpResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email.toLowerCase(),
          // phone: data.phone,
          action: "register",
        }),
      });

      const otpResult = await otpResponse.json();

      if (!otpResponse.ok) {
        throw new Error(otpResult.message || "Failed to send OTP");
      }

      console.log("✅ OTP sent successfully");
      setCurrentStep(RegistrationStep.OTP_VERIFICATION);

      // Start timer for OTP expiry (5 minutes)
      setOtpTimer(300);
      setCanResendEmail(false);
      // setCanResendPhone(false);
    } catch (err: any) {
      console.error("❌ OTP sending error:", err);
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Handle OTP verification (step 2) - Email only
  const onSubmitOtp = async () => {
    if (!emailOtp) {
      setError("Please enter email OTP");
      return;
    }

    if (emailOtp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    if (!registrationData) {
      setError("Registration data not found");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Verifying OTP...");

      // FIXED: First verify email OTP only
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registrationData.email.toLowerCase(),
          // phone: registrationData.phone,
          emailOtp,
          // phoneOtp,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyResult.message || "OTP verification failed");
      }

      console.log("✅ OTP verified successfully");

      // FIXED: If OTP verification successful, proceed with registration
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registrationData.name,
          email: registrationData.email.toLowerCase(),
          // phone: registrationData.phone,
          role: registrationData.role,
          institution: registrationData.institution,
          password: registrationData.password,
          emailVerified: true,
          // phoneVerified: true,
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerResult.message || "Registration failed");
      }

      console.log("✅ Registration successful:", registerResult);
      setCurrentStep(RegistrationStep.SUCCESS);

      // Auto-login after successful registration
      setTimeout(async () => {
        console.log("🔄 Attempting auto-login...");
        const signInResult = await signIn("credentials", {
          email: registrationData.email.toLowerCase(),
          password: registrationData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          console.log("✅ Auto-login successful, redirecting...");
          const roleRoutes: Record<string, string> = {
            ORGANIZER: "/organizer",
            EVENT_MANAGER: "/event-manager",
            FACULTY: "/faculty",
            DELEGATE: "/delegate",
            HALL_COORDINATOR: "/hall-coordinator",
            SPONSOR: "/sponsor",
            VOLUNTEER: "/volunteer",
            VENDOR: "/vendor",
          };

          const redirectUrl = roleRoutes[registrationData.role] || "/delegate";
          router.push(redirectUrl);
        } else {
          console.log("❌ Auto-login failed, redirecting to login page");
          router.push("/login");
        }
      }, 2000);
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Resend OTP function - Email only
  const resendOtp = async (type: "email") => {
    if (!registrationData) return;

    setIsResendingEmail(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registrationData.email.toLowerCase(),
          // phone: type === "phone" ? registrationData.phone : undefined,
          action: "resend",
          type: type,
        }),
      });

      if (response.ok) {
        // Reset timer and disable resend button
        setOtpTimer(300);
        setCanResendEmail(false);
        // setCanResendPhone(false);

        // Clear the email OTP input
        setEmailOtp("");
      }
    } catch (err) {
      console.error(`Failed to resend ${type} OTP:`, err);
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      console.log("🔄 Attempting Google sign-in...");
      await signIn("google", {
        callbackUrl: "/delegate",
        redirect: true,
      });
    } catch (err) {
      console.error("❌ Google sign-in error:", err);
      setError("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Success screen
  if (currentStep === RegistrationStep.SUCCESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Registration Successful!
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your account has been created and verified successfully. You
                  will be redirected to your dashboard shortly.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Redirecting...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              {currentStep === RegistrationStep.DETAILS ? (
                <Calendar className="w-6 h-6 text-white" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {currentStep === RegistrationStep.DETAILS
                ? "Create Account"
                : "Verify Your Identity"}
            </CardTitle>
            <CardDescription>
              {currentStep === RegistrationStep.DETAILS
                ? "Join the Conference Management platform"
                : "Enter the verification code sent to your email"}
            </CardDescription>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-8 h-2 rounded-full ${
                  currentStep === RegistrationStep.DETAILS
                    ? "bg-blue-600"
                    : "bg-blue-200"
                }`}
              />
              <div
                className={`w-8 h-2 rounded-full ${
                  currentStep === RegistrationStep.OTP_VERIFICATION
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <ErrorAlert onClose={() => setError("")}>{error}</ErrorAlert>
            )}

            {/* Step 1: Registration Details */}
            {currentStep === RegistrationStep.DETAILS && (
              <form
                onSubmit={handleSubmit(onSubmitDetails)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Dr. John Doe"
                      className="pl-10"
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <InlineAlert
                      type="error"
                      message={errors.name.message || ""}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <InlineAlert
                      type="error"
                      message={errors.email.message || ""}
                    />
                  )}
                </div>

                {/* Phone number field - COMMENTED OUT */}
                {/* <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <InlineAlert
                      type="error"
                      message={errors.phone.message || ""}
                    />
                  )}
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("role", value as UserRole)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORGANIZER">
                        Conference Organizer
                      </SelectItem>
                      <SelectItem value="EVENT_MANAGER">
                        Event Manager
                      </SelectItem>
                      {/* <SelectItem value="FACULTY">Faculty/Speaker</SelectItem>
                      <SelectItem value="DELEGATE">Delegate/Attendee</SelectItem>
                      <SelectItem value="HALL_COORDINATOR">Hall Coordinator</SelectItem>
                      <SelectItem value="SPONSOR">Sponsor</SelectItem>
                      <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                      <SelectItem value="VENDOR">Vendor</SelectItem> */}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <InlineAlert
                      type="error"
                      message={errors.role.message || ""}
                    />
                  )}
                </div>

                {(selectedRole === "FACULTY" ||
                  selectedRole === "ORGANIZER" ||
                  selectedRole === "EVENT_MANAGER") && (
                  <div className="space-y-2">
                    <Label htmlFor="institution">
                      Institution/Organization
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="institution"
                        type="text"
                        placeholder="University/Hospital/Organization"
                        className="pl-10"
                        {...register("institution")}
                      />
                    </div>
                    {errors.institution && (
                      <InlineAlert
                        type="error"
                        message={errors.institution.message || ""}
                      />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-12"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <InlineAlert
                      type="error"
                      message={errors.password.message || ""}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-12"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <InlineAlert
                      type="error"
                      message={errors.confirmPassword.message || ""}
                    />
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    id="agreeToTerms"
                    type="checkbox"
                    className="rounded mt-1"
                    {...register("agreeToTerms")}
                  />
                  <Label
                    htmlFor="agreeToTerms"
                    className="text-sm leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.agreeToTerms && (
                  <InlineAlert
                    type="error"
                    message={errors.agreeToTerms.message || ""}
                  />
                )}

                <LoadingButton
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                >
                  Send Verification Code
                </LoadingButton>
              </form>
            )}

            {/* Step 2: OTP Verification - FIXED: Email only */}
            {currentStep === RegistrationStep.OTP_VERIFICATION && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    We've sent a 6-digit verification code to:
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-blue-600">
                      📧 {registrationData?.email}
                    </p>
                    {/* Phone display - COMMENTED OUT */}
                    {/* <p className="text-xs font-medium text-green-600">
                      📱 {registrationData?.phone}
                    </p> */}
                  </div>
                  {otpTimer > 0 && (
                    <div className="flex items-center justify-center gap-1 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full mt-3">
                      <Clock className="w-3 h-3" />
                      Code expires in: {formatTimer(otpTimer)}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Email OTP */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Email Verification Code
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => resendOtp("email")}
                        disabled={!canResendEmail || isResendingEmail}
                        className="h-6 px-2 text-xs"
                      >
                        {isResendingEmail ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    </div>
                    <OTPInput
                      length={6}
                      value={emailOtp}
                      onChange={setEmailOtp}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Phone OTP - COMMENTED OUT */}
                  {/* <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Phone Verification Code
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => resendOtp("phone")}
                        disabled={!canResendPhone || isResendingPhone}
                        className="h-6 px-2 text-xs"
                      >
                        {isResendingPhone ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    </div>
                    <OTPInput
                      length={6}
                      value={phoneOtp}
                      onChange={setPhoneOtp}
                      disabled={isLoading}
                    />
                  </div> */}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(RegistrationStep.DETAILS);
                      setEmailOtp("");
                      // setPhoneOtp("");
                      setOtpTimer(0);
                    }}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <LoadingButton
                    type="button"
                    loading={isLoading}
                    onClick={onSubmitOtp}
                    className="flex-1"
                    disabled={
                      !emailOtp ||
                      emailOtp.length !== 6
                    }
                  >
                    Verify & Register
                  </LoadingButton>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Didn't receive the code? Check your spam folder or try
                    resending after the timer expires.
                  </p>
                </div>
              </div>
            )}

            {/* Google sign-in option (show only on first step) */}
            {currentStep === RegistrationStep.DETAILS && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                      Or
                    </span>
                  </div>
                </div>

                <LoadingButton
                  type="button"
                  loading={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full"
                >
                  <Chrome className="w-4 mr-2" />
                  Continue with Google
                </LoadingButton>

                <div className="text-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                  </span>
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}