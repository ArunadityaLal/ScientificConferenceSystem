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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  facultyId: string; // This will be ignored, we'll get the correct ID from the session
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
}: Props) {
  const { data: session } = useSession();
  const email = session?.user?.email || "";

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
    fd.append("facultyId", actualFacultyId); // Use correct faculty ID
    fd.append("sessionId", sessionId);

    console.log("📤 Uploading CV with faculty ID:", actualFacultyId);
    
    const res = await fetch("/api/faculty/cv", { method: "POST", body: fd });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `CV upload failed (${res.status})`);
    }
  };

  const uploadPres = async (sessionId: string) => {
    if (presFiles.length === 0 || !actualFacultyId) return;
    const fd = new FormData();
    presFiles.forEach((f) => fd.append("files", f));
    fd.append("facultyId", actualFacultyId); // Use correct faculty ID
    fd.append("sessionId", sessionId);

    const res = await fetch("/api/faculty/presentations/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Presentation upload failed (${res.status})`);
    }
  };

  const onSubmit = async () => {
    try {
      setBusy(true);
      setMsg(null);
      setErr(null);

      if (!actualFacultyId) {
        throw new Error("Faculty ID not available. Please try again.");
      }

      if (!selectedSessionId) throw new Error("Select a session");
      if (!cvFile && presFiles.length === 0)
        throw new Error("Attach a CV or at least one presentation");

      if (cvFile) await uploadCv(selectedSessionId);
      if (presFiles.length > 0) await uploadPres(selectedSessionId);

      setMsg("Upload successful ✅");
      setCvFile(null);
      setPresFiles([]);
      setTimeout(() => onClose(), 1000);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Documents
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Select an accepted session, then upload your CV and/or presentations.
          </DialogDescription>
        </DialogHeader>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-slate-500 bg-slate-800 p-2 rounded">
            Debug: Session ID = {session?.user?.id} | Actual Faculty ID = {actualFacultyId}
          </div>
        )}

        {/* Sessions */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Accepted Session</div>
          {sessionsLoading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : sessionsErr ? (
            <div className="text-sm text-red-400">{sessionsErr}</div>
          ) : acceptedSessions.length === 0 ? (
            <div className="rounded border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
              No accepted sessions
            </div>
          ) : (
            <select
              className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm"
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
              <div className="text-sm font-medium">Curriculum Vitae (CV)</div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => onPickCv(e.target.files?.[0] ?? null)}
                className="mt-2 text-sm"
              />
              {cvFile && (
                <p className="text-xs mt-1 text-slate-300">
                  {cvFile.name} • {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* Presentations */}
            <div className="mt-4">
              <div className="text-sm font-medium">Presentations</div>
              <input
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => onPickPres(e.target.files)}
                className="mt-2 text-sm"
              />
              {presFiles.length > 0 && (
                <ul className="mt-2 text-xs text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                  {presFiles.map((f, i) => (
                    <li key={i}>
                      {f.name} • {(f.size / 1024 / 1024).toFixed(2)} MB
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {!actualFacultyId && (
          <div className="text-yellow-400 text-xs">
            Getting faculty information...
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs">
            {err && <span className="text-red-400">{err}</span>}
            {msg && <span className="text-emerald-400">{msg}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={
                busy || !selectedSessionId || !actualFacultyId || (!cvFile && presFiles.length === 0)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {busy ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}