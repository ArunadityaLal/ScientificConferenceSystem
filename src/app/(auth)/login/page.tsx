"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  LoadingButton,
  ErrorAlert,
  InlineAlert,
} from "@/components/ui";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Calendar,
  QrCode,
  Chrome,
  ArrowLeft,
} from "lucide-react";

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Separate component that uses useSearchParams
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        // Get user session to determine redirect
        const session = await getSession();
        if (session?.user?.role) {
          const roleRoutes = {
            ORGANIZER: "/organizer",
            EVENT_MANAGER: "/event-manager",
            FACULTY: "/faculty",
            DELEGATE: "/delegate",
            HALL_COORDINATOR: "/hall-coordinator",
            SPONSOR: "/sponsor",
            VOLUNTEER: "/volunteer",
            VENDOR: "/vendor",
          };

          const redirectUrl = roleRoutes[session.user.role] || "/delegate";
          router.push(callbackUrl !== "/" ? callbackUrl : redirectUrl);
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      await signIn("google", {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      setError("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  // Get error message from URL params
  const getAuthErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password";
      case "EmailSignin":
        return "Error sending email verification";
      case "OAuthSignin":
        return "Error with OAuth provider";
      case "OAuthCallback":
        return "Error in OAuth callback";
      case "OAuthCreateAccount":
        return "Could not create OAuth account";
      case "EmailCreateAccount":
        return "Could not create email account";
      case "Callback":
        return "Error in callback";
      case "OAuthAccountNotLinked":
        return "OAuth account not linked. Please use the same provider you used to sign up.";
      case "SessionRequired":
        return "Please sign in to continue";
      default:
        return "An error occurred during authentication";
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Back to Home */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Login Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Conference Management account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Auth Error Alert */}
          {authError && (
            <ErrorAlert>{getAuthErrorMessage(authError)}</ErrorAlert>
          )}

          {/* Login Error */}
          {error && (
            <ErrorAlert onClose={() => setError("")}>{error}</ErrorAlert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Login Button */}
            <LoadingButton
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              Sign In
            </LoadingButton>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-in */}
          <LoadingButton
            type="button"
            loading={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            <Chrome className="w-4 h-4 mr-2" />
            Continue with Google
          </LoadingButton>

          {/* QR Login */}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/qr-login")}
            className="w-full"
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code Login
          </Button>

          {/* Sign Up Link */}
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
            </span>
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading fallback component
function LoginPageSkeleton() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-6"></div>
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Suspense fallback={<LoginPageSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}