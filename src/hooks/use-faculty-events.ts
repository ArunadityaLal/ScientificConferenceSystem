import { useState, useEffect } from "react";

interface EventInvitation {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  sessionCount: number;
  duration: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  invitedAt: string;
  respondedAt?: string;
  notes?: string;
  rejectionReason?: string;
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
}

interface FacultyInvitation {
  id: string;
  name: string;
  email: string;
  department?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  invitedAt: string;
  respondedAt?: string;
  eventId: string;
  eventTitle: string;
  notes?: string;
  rejectionReason?: string;
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
}

export function useFacultyEvents(email?: string) {
  const [events, setEvents] = useState<EventInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertInvitationToEvent = (
    inv: FacultyInvitation
  ): EventInvitation => {
    // Calculate dates based on invitation date
    const inviteDate = new Date(inv.invitedAt);
    const startDate = new Date(inviteDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    return {
      id: inv.eventId || `event-${inv.id}`,
      title: inv.eventTitle || "Academic Conference 2025",
      description: `Dear ${inv.name || "Faculty Member"},

You have been invited to participate in this academic conference. Your expertise in ${
        inv.department || "your field"
      } would be valuable to our academic community.

This conference brings together distinguished faculty members and researchers from various institutions. The event will feature:

• Keynote presentations by leading experts
• Panel discussions on current research trends  
• Networking opportunities with peers
• Collaborative workshops and breakout sessions
• Recognition of outstanding academic contributions

Your participation would contribute significantly to the academic discourse and help advance research in your field.

We look forward to your positive response and hope to see you at this prestigious event.`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: "University Campus",
      venue: "Main Auditorium",
      sessionCount: 5,
      duration: "3 days",
      status: inv.status || "PENDING",
      invitedAt: inv.invitedAt,
      respondedAt: inv.respondedAt,
      notes: inv.notes,
      rejectionReason: inv.rejectionReason,
      suggestedTopic: inv.suggestedTopic,
      suggestedTimeStart: inv.suggestedTimeStart,
      suggestedTimeEnd: inv.suggestedTimeEnd,
      optionalQuery: inv.optionalQuery,
    };
  };

  const fetchEventsFromLocalStorage = () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get faculty invitations from localStorage
      const savedInvitations = localStorage.getItem("facultyInvitations");

      if (savedInvitations) {
        const invitations: FacultyInvitation[] = JSON.parse(savedInvitations);
        console.log("📋 Found saved invitations:", invitations.length);

        // Filter invitations for this specific email
        const userInvitations = invitations.filter(
          (inv: FacultyInvitation) =>
            inv.email.toLowerCase() === email.toLowerCase()
        );

        console.log(
          `👤 Found ${userInvitations.length} invitations for ${email}`
        );

        // Convert invitations to event format
        const eventData = userInvitations.map(convertInvitationToEvent);

        setEvents(eventData);
      } else {
        console.log("📝 No saved invitations found in localStorage");
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching faculty events from localStorage:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const respondToEvent = async (
    eventId: string,
    status: "ACCEPTED" | "DECLINED",
    additionalData?: {
      rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
      suggestedTopic?: string;
      suggestedTimeStart?: string;
      suggestedTimeEnd?: string;
      optionalQuery?: string;
    }
  ) => {
    try {
      // First, call the API to record the response
      const response = await fetch("/api/faculty/respond-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          email,
          status,
          ...additionalData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to respond to event");
      }

      const result = await response.json();

      if (result.success) {
        // Update localStorage with the response
        const savedInvitations = localStorage.getItem("facultyInvitations");
        if (savedInvitations) {
          const invitations: FacultyInvitation[] = JSON.parse(savedInvitations);
          const updatedInvitations = invitations.map((inv) => {
            if (
              inv.eventId === eventId &&
              inv.email.toLowerCase() === email?.toLowerCase()
            ) {
              return {
                ...inv,
                status,
                respondedAt: new Date().toISOString(),
                ...additionalData,
              };
            }
            return inv;
          });

          localStorage.setItem(
            "facultyInvitations",
            JSON.stringify(updatedInvitations)
          );

          // Trigger a storage event to notify other tabs/components
          window.dispatchEvent(new Event("storage"));
        }

        // Update local state immediately
        setEvents((prev) =>
          prev.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  status,
                  respondedAt: new Date().toISOString(),
                  ...additionalData,
                }
              : event
          )
        );

        console.log(`✅ Event ${eventId} ${status.toLowerCase()} successfully`);
        return result;
      } else {
        throw new Error(result.error || "Failed to respond to event");
      }
    } catch (err) {
      console.error("Error responding to event:", err);
      throw err;
    }
  };

  // Listen for localStorage changes (from other tabs or components)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("🔄 localStorage changed, refetching events");
      fetchEventsFromLocalStorage();
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events we dispatch
    window.addEventListener("facultyInvitationsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "facultyInvitationsUpdated",
        handleStorageChange
      );
    };
  }, [email]);

  // Initial load
  useEffect(() => {
    fetchEventsFromLocalStorage();
  }, [email]);

  return {
    events,
    loading,
    error,
    refetch: fetchEventsFromLocalStorage,
    respondToEvent,
  };
}
