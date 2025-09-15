// app/modals/UploadDocumentsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Presentation } from "lucide-react";

type Session = {
  id: string;
  title?: string;
  inviteStatus?: "Accepted" | "Pending" | "Declined";
};

type Theme = "light" | "dark";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  facultyId: string; // This will be ignored, we'll get the correct ID from the session
  theme?: Theme; // Add theme prop
};

// Theme classes function (same as faculty page)
const getThemeClasses = (theme: Theme) => {
  if (theme === "light") {
    return {
      dialog: "border-gray-300 bg-white text-gray-900",
      text: {
        primary: "text-gray-900",
        secondary: "text-gray-600",
        muted: "text-gray-500",
        accent: "text-blue-600",
        success: "text-emerald-600",
        warning: "text-yellow-600",
        error: "text-red-600",
      },
      background: {
        primary: "bg-white",
        secondary: "bg-gray-50",
        tertiary: "bg-gray-100",
        modal: "bg-white border-gray-300",
        debug: "bg-gray-100",
      },
      border: "border-gray-300",
      input: "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white",
      },
    };
  } else {
    return {
      dialog: "border-slate-800 bg-slate-900 text-slate-100",
      text: {
        primary: "text-white",
        secondary: "text-slate-300",
        muted: "text-slate-400",
        accent: "text-blue-400",
        success: "text-emerald-400",
        warning: "text-yellow-400",
        error: "text-red-400",
      },
      background: {
        primary: "bg-slate-900",
        secondary: "bg-slate-800",
        tertiary: "bg-slate-700",
        modal: "bg-slate-900 border-slate-800",
        debug: "bg-slate-800",
      },
      border: "border-slate-700",
      input: "border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900",
      },
    };
  }
};

const CV_MAX_MB = 10;
const PRES_MAX_MB = 50;

const cvMimes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const presMimes = [
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function UploadDocumentsModal({
  isOpen,
  onClose,
  facultyId, // We'll ignore this prop and get the correct ID
  theme = "dark", // Default to dark theme for backward compatibility
}: Props) {
  const { data: session } = useSession();
  const email = session?.user?.email || "";
  const themeClasses = getThemeClasses(theme);

  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsErr, setSessionsErr] = useState<string | null>(null);
  const [actualFacultyId, setActualFacultyId] = useState<string>("");
  
  const acceptedSessions = useMemo(
    () => sessions.filter((s) => s.inviteStatus === "Accepted"),
    [sessions]
  );
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [presFiles, setPresFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Extract actual faculty ID from session ID
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const sessionId = session.user.id;
    console.log("Session ID:", sessionId);
    
    // Extract base ID by removing timestamp suffix
    // faculty-evt_1757606305913_08ogpofub-1757622980153-2 → faculty-evt_1757606305913_08ogpofub
    const parts = sessionId.split('-');
    console.log("ID parts:", parts);
    
    if (
      parts.length >= 4 &&
      parts[0] === 'faculty' &&
      typeof parts[1] === 'string' &&
      parts[1].startsWith('evt_')
    ) {
      // Take first 2 parts: faculty-evt_1757606305913_08ogpofub
      const baseId = parts.slice(0, 2).join('-');
      setActualFacultyId(baseId);
      console.log("✅ Extracted faculty ID:", baseId);
    } else {
      // Fallback: use the session ID as is
      setActualFacultyId(sessionId);
      console.log("⚠️ Using session ID as faculty ID:", sessionId);
    }
  }, [session?.user?.id]);

  // Load sessions
  useEffect(() => {
    if (!isOpen || !email) return;
    (async () => {
      try {
        setSessionsLoading(true);
        setSessionsErr(null);

        const res = await fetch(`/api/faculty/sessions?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error(`Failed (${res.status})`);

        const j = await res.json();
        setSessions(Array.isArray(j?.data?.sessions) ? j.data.sessions : []);
      } catch (e: any) {
        setSessionsErr(e?.message || "Failed to load sessions");
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    })();
  }, [isOpen, email]);

  // File validation
  const validate = (file: File, kind: "cv" | "pres") => {
    if (kind === "cv") {
      if (!cvMimes.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name))
        return "CV must be PDF/DOC/DOCX";
      if (file.size > CV_MAX_MB * 1024 * 1024)
        return `CV must be ≤ ${CV_MAX_MB}MB`;
    } else {
      if (
        !presMimes.includes(file.type) &&
        !/\.(pdf|ppt|pptx|doc|docx)$/i.test(file.name)
      )
        return "Presentation must be PDF/PPT/PPTX/DOC/DOCX";
      if (file.size > PRES_MAX_MB * 1024 * 1024)
        return `Presentation must be ≤ ${PRES_MAX_MB}MB`;
    }
    return null;
  };

  const onPickCv = (f: File | null) => {
    if (!f) return setCvFile(null);
    const v = validate(f, "cv");
    if (v) return setErr(v);
    setErr(null);
    setCvFile(f);
  };

  const onPickPres = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    for (const f of incoming) {
      const v = validate(f, "pres");
      if (v) return setErr(v);
    }
    setErr(null);
    setPresFiles((prev) => [...prev, ...incoming]);
  };

  // Upload handlers - use actualFacultyId instead of facultyId prop
  const uploadCv = async (sessionId: string) => {
    if (!cvFile || !actualFacultyId) return;
    const fd = new FormData();
    fd.append("file", cvFile);
    fd.append("facultyId", actualFacultyId);
    fd.append("sessionId", sessionId);

    console.log("📤 Uploading CV with faculty ID:", actualFacultyId);
    
    const res = await fetch("/api/faculty/cv", { method: "POST", body: fd });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `CV upload failed (${res.status})`);
    }
  };

  // FIXED: Improved presentation upload with better error handling and logging
  const uploadPres = async (sessionId: string) => {
    if (presFiles.length === 0 || !actualFacultyId) return;
    
    console.log("📤 Starting presentation upload:", {
      fileCount: presFiles.length,
      facultyId: actualFacultyId,
      sessionId: sessionId,
      fileNames: presFiles.map(f => f.name),
      fileSizes: presFiles.map(f => f.size)
    });

    const fd = new FormData();
    
    // CRITICAL: Ensure each file is properly appended
    presFiles.forEach((file, index) => {
      console.log(`📎 Appending file ${index + 1}:`, file.name, `(${file.size} bytes, ${file.type})`);
      fd.append("files", file, file.name);
    });
    
    fd.append("facultyId", actualFacultyId);
    // FIXED: Better session ID handling
    if (sessionId && sessionId !== "boo") { // Don't send invalid session IDs
      fd.append("sessionId", sessionId);
    } else {
      console.log("⚠️ Invalid or missing session ID, uploading without session association");
    }

    // Log FormData contents for debugging
    console.log("📋 FormData contents:");
    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    try {
      console.log("🚀 Sending presentation upload request...");
      const res = await fetch("/api/faculty/presentations/upload", {
        method: "POST",
        body: fd,
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Presentation upload failed:", {
          status: res.status,
          statusText: res.statusText,
          errorData
        });
        throw new Error(errorData.error || errorData.details || `Presentation upload failed (${res.status})`);
      }

      const responseData = await res.json();
      console.log("✅ Presentation upload successful:", responseData);
      return responseData;

    } catch (fetchError) {
      console.error("❌ Fetch error during presentation upload:", fetchError);
      throw fetchError;
    }
  };

  const onSubmit = async () => {
    try {
      setBusy(true);
      setMsg(null);
      setErr(null);

      console.log("🚀 Starting upload process...");

      if (!actualFacultyId) {
        throw new Error("Faculty ID not available. Please try again.");
      }

      if (!selectedSessionId) throw new Error("Select a session");
      if (!cvFile && presFiles.length === 0)
        throw new Error("Attach a CV or at least one presentation");

      console.log("📋 Upload details:", {
        facultyId: actualFacultyId,
        sessionId: selectedSessionId,
        hasCv: !!cvFile,
        presentationCount: presFiles.length
      });

      // Upload CV first if present
      if (cvFile) {
        console.log("📤 Uploading CV...");
        await uploadCv(selectedSessionId);
        console.log("✅ CV upload completed");
      }

      // Upload presentations if present
      if (presFiles.length > 0) {
        console.log("📤 Uploading presentations...");
        await uploadPres(selectedSessionId);
        console.log("✅ Presentation upload completed");
      }

      setMsg("Upload successful ✅");
      setCvFile(null);
      setPresFiles([]);
      setTimeout(() => onClose(), 1000);

    } catch (e: any) {
      console.error("❌ Upload error:", e);
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  // FIXED: Add function to remove presentation files from list
  const removePresFile = (index: number) => {
    setPresFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`max-w-2xl ${themeClasses.dialog}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Documents
          </DialogTitle>
          <DialogDescription className={themeClasses.text.muted}>
            Select an accepted session, then upload your CV and/or presentations.
          </DialogDescription>
        </DialogHeader>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`text-xs ${themeClasses.text.muted} ${themeClasses.background.debug} p-2 rounded`}>
            Debug: Session ID = {session?.user?.id} | Actual Faculty ID = {actualFacultyId}
          </div>
        )}

        {/* Sessions */}
        <div className="space-y-2">
          <div className={`text-sm font-medium ${themeClasses.text.primary}`}>Accepted Session</div>
          {sessionsLoading ? (
            <div className={`text-sm ${themeClasses.text.secondary}`}>Loading…</div>
          ) : sessionsErr ? (
            <div className={`text-sm ${themeClasses.text.error}`}>{sessionsErr}</div>
          ) : acceptedSessions.length === 0 ? (
            <div className={`rounded border ${themeClasses.border} ${themeClasses.background.secondary} p-3 text-xs ${themeClasses.text.secondary}`}>
              No accepted sessions
            </div>
          ) : (
            <select
              className={`w-full rounded border ${themeClasses.input} p-2 text-sm`}
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
            >
              <option value="">Select a session…</option>
              {acceptedSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || "Untitled"}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Upload sections */}
        {selectedSessionId && actualFacultyId && (
          <>
            {/* CV */}
            <div className="mt-4">
              <div className={`text-sm font-medium ${themeClasses.text.primary}`}>Curriculum Vitae (CV)</div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => onPickCv(e.target.files?.[0] ?? null)}
                className={`mt-2 text-sm ${themeClasses.text.primary}`}
              />
              {cvFile && (
                <p className={`text-xs mt-1 ${themeClasses.text.secondary}`}>
                  {cvFile.name} • {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* Presentations */}
            <div className="mt-4">
              <div className={`text-sm font-medium ${themeClasses.text.primary}`}>Presentations</div>
              <input
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => onPickPres(e.target.files)}
                className={`mt-2 text-sm ${themeClasses.text.primary}`}
              />
              {presFiles.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {presFiles.map((f, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs ${themeClasses.text.secondary} p-2 rounded ${themeClasses.background.secondary}`}>
                      <span>{f.name} • {(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button
                        onClick={() => removePresFile(i)}
                        className={`text-xs ${themeClasses.text.error} hover:underline ml-2`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!actualFacultyId && (
          <div className={`${themeClasses.text.warning} text-xs`}>
            Getting faculty information...
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs">
            {err && <span className={themeClasses.text.error}>{err}</span>}
            {msg && <span className={themeClasses.text.success}>{msg}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy} className={themeClasses.button.secondary}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={
                busy || !selectedSessionId || !actualFacultyId || (!cvFile && presFiles.length === 0)
              }
              className={themeClasses.button.primary}
            >
              {busy ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}