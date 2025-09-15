"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  Mail,
  Shield,
  Calendar,
  MapPin,
} from "lucide-react";

export default function FacultyLoginPage() {
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Event invitation context
  const [eventContext, setEventContext] = useState<any>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      const eventIdParam = params.get("eventId");
      const invitationIdParam = params.get("invitationId");
      const refParam = params.get("ref");

      if (emailParam) setEmail(decodeURIComponent(emailParam));

      // If this is from an event invitation, set context
      if (refParam === "event-invitation" && eventIdParam) {
        setEventContext({
          eventId: eventIdParam,
          invitationId: invitationIdParam,
          ref: refParam,
        });

        // Set invitation details (in real app, fetch from API)
        setInvitationDetails({
          eventTitle: "Academic Excellence Conference 2025",
          eventDates: "March 15-17, 2025",
          location: "University Campus",
          venue: "Main Auditorium",
        });
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Include event context in callback URL if present
      let callbackUrl = "/faculty";
      if (eventContext) {
        const params = new URLSearchParams({
          eventId: eventContext.eventId || "",
          invitationId: eventContext.invitationId || "",
          ref: "event-invitation",
        });
        callbackUrl = `/faculty?${params.toString()}`;
      }

      await signIn("google", { callbackUrl, email });
    } catch (e) {
      alert("Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-white">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-b from-indigo-600 to-purple-600 flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Faculty Portal Login</h1>
          <p className="mt-2 text-gray-300">Secure access to your dashboard</p>

          {/* Event invitation context */}
          {invitationDetails && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Event Invitation</span>
              </div>
              <h3 className="font-semibold text-blue-100 text-sm">
                {invitationDetails.eventTitle}
              </h3>
              <div className="flex items-center gap-4 text-xs text-blue-200 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{invitationDetails.eventDates}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{invitationDetails.location}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email Address (Optional)
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                className="w-full rounded-xl p-3 pr-10 bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
              <Mail className="absolute right-3 top-1/2 -mt-2.5 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Pre-fill your email for faster sign-in
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className={`w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 font-semibold shadow-lg text-white transition ${
              googleLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-[1.02]"
            }`}
          >
            {googleLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21.805 10.023h-9.54v3.935h5.59c-.238 1.428-1.488 4.191-5.59 4.191-3.372 0-6.122-2.774-6.122-6.19s2.75-6.19 6.123-6.19c1.91 0 3.19.818 3.931 1.52l2.68-2.6c-1.572-1.466-3.636-2.365-6.612-2.365-5.438 0-9.851 4.507-9.851 10.055s4.412 10.055 9.85 10.055c5.69 0 9.458-3.984 9.458-9.6 0-.646-.07-1.022-.163-1.27z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {invitationDetails && (
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Secure login • Your invitation is waiting inside</p>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </main>
  );
}