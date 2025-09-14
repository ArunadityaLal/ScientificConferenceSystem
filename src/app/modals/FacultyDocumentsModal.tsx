// app/modals/FacultyDocumentsModal.tsx
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileText, Presentation, Eye, Trash2, Upload } from "lucide-react";

type SessionRow = {
  id: string;
  title?: string;
  inviteStatus?: "Accepted" | "Pending" | "Declined";
  formattedTime?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  place?: string;
  roomName?: string;
  eventName?: string;
};

type CvRow = {
  id: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  originalFilename: string;
  uploadedAt: string;
  sessionMetadataId?: string;
};

type PresRow = {
  id: string;
  title: string;
  filePath: string;
  fileSize: number;
  originalFilename: string;
  uploadedAt: string;
  session: { id: string; title?: string; startTime?: string } | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  facultyId: string;
};

export default function FacultyDocumentsModal({ isOpen, onClose, facultyId }: Props) {
  const { data: session } = useSession();
  const email = session?.user?.email || "";

  // Extract actual faculty ID from session (same logic as upload modal)
  const [actualFacultyId, setActualFacultyId] = useState<string>("");

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const sessionId = session.user.id;
    const parts = sessionId.split('-');
    
    if (parts.length >= 2 && parts[0] === 'faculty' && parts[1]?.startsWith('evt_')) {
      const baseId = parts.slice(0, 2).join('-');
      setActualFacultyId(baseId);
    } else {
      setActualFacultyId(sessionId);
    }
  }, [session?.user?.id]);

  // Sessions
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsErr, setSessionsErr] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const acceptedSessions = useMemo(
    () => sessions.filter((s) => s.inviteStatus === "Accepted"),
    [sessions]
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Documents
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [presentations, setPresentations] = useState<PresRow[]>([]);

  // Ops state
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "cv" | "pres"; id: string } | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Load accepted sessions when modal opens
  useEffect(() => {
    if (!isOpen || !email) return;
    const run = async () => {
      try {
        setSessionsLoading(true);
        setSessionsErr(null);
        const res = await fetch(`/api/faculty/sessions?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Failed to load sessions (${res.status})`);
        }
        const j = await res.json();
        const list: SessionRow[] = j?.data?.sessions || [];
        setSessions(Array.isArray(list) ? list : []);
      } catch (e: any) {
        setSessionsErr(e?.message || "Failed to load sessions");
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };
    run();
  }, [isOpen, email]);

  // Load documents for selected session
  const refreshDocs = async (sessionId: string) => {
    if (!sessionId || !actualFacultyId) return;
    try {
      setLoading(true);
      setLoadErr(null);

      console.log("Fetching documents for:", { facultyId: actualFacultyId, sessionId });

      // Fetch both CVs and presentations for the selected session
      const [cvRes, presRes] = await Promise.all([
        fetch(`/api/faculty/cv?facultyId=${encodeURIComponent(actualFacultyId)}&sessionId=${encodeURIComponent(sessionId)}`, { 
          cache: "no-store" 
        }),
        fetch(`/api/faculty/presentations/upload?facultyId=${encodeURIComponent(actualFacultyId)}&sessionId=${encodeURIComponent(sessionId)}`, { 
          cache: "no-store" 
        }),
      ]);

      if (!cvRes.ok) {
        const j = await cvRes.json().catch(() => ({}));
        throw new Error(j.error || `Failed to load CVs (${cvRes.status})`);
      }
      if (!presRes.ok) {
        const j = await presRes.json().catch(() => ({}));
        throw new Error(j.error || `Failed to load presentations (${presRes.status})`);
      }

      const cvJ = await cvRes.json();
      const presJ = await presRes.json();

      setCvs((cvJ?.data?.cvs || []) as CvRow[]);
      setPresentations((presJ?.data?.presentations || []) as PresRow[]);
    } catch (e: any) {
      setLoadErr(e?.message || "Failed to load documents");
      setCvs([]);
      setPresentations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !selectedSessionId || !actualFacultyId) return;
    refreshDocs(selectedSessionId);
  }, [isOpen, selectedSessionId, actualFacultyId]);

  // Helpers
  const pickFile = async (accept: string): Promise<File | null> =>
    new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = () => resolve(input.files?.[0] || null);
      input.click();
    });

  // Delete handlers
  const deleteCv = async (id: string) => {
    const res = await fetch("/api/faculty/cv/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, facultyId: actualFacultyId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `CV delete failed (${res.status})`);
    }
  };

  const deletePres = async (id: string) => {
    const res = await fetch("/api/faculty/presentations/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: id, facultyId: actualFacultyId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `Presentation delete failed (${res.status})`);
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { kind, id } = confirmDelete;
    try {
      setWorkingId(id);
      setErr(null);
      setMsg(null);
      if (kind === "cv") await deleteCv(id);
      else await deletePres(id);
      setMsg("Deleted successfully.");
      if (selectedSessionId) await refreshDocs(selectedSessionId);
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    } finally {
      setWorkingId(null);
      setConfirmDelete(null);
    }
  };

  // Replace handlers
  const replaceCv = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("facultyId", actualFacultyId);
    fd.append("file", file, file.name);
    const res = await fetch("/api/faculty/cv/replace", { method: "POST", body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `CV replace failed (${res.status})`);
    }
  };

  const replacePres = async (row: PresRow, file: File) => {
    // Replace presentation: delete old and upload new
    await deletePres(row.id);
    const fd = new FormData();
    fd.append("files", file, file.name);
    fd.append("facultyId", actualFacultyId);
    if (selectedSessionId) fd.append("sessionId", selectedSessionId);
    const res = await fetch("/api/faculty/presentations/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `Presentation replace failed (${res.status})`);
    }
  };

  const onPickReplaceCv = async (id: string) => {
    const f = await pickFile(".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (!f) return;
    try {
      setWorkingId(id);
      setErr(null);
      setMsg(null);
      await replaceCv(id, f);
      setMsg("CV replaced successfully.");
      if (selectedSessionId) await refreshDocs(selectedSessionId);
    } catch (e: any) {
      setErr(e?.message || "Replace failed");
    } finally {
      setWorkingId(null);
    }
  };

  const onPickReplacePres = async (row: PresRow) => {
    const f = await pickFile(".pdf,.ppt,.pptx,.doc,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (!f) return;
    try {
      setWorkingId(row.id);
      setErr(null);
      setMsg(null);
      await replacePres(row, f);
      setMsg("Presentation replaced successfully.");
      if (selectedSessionId) await refreshDocs(selectedSessionId);
    } catch (e: any) {
      setErr(e?.message || "Replace failed");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              View / Edit Documents
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select an accepted session to view, delete, or replace documents for that specific session.
            </DialogDescription>
          </DialogHeader>

          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-slate-500 bg-slate-800 p-2 rounded">
              Debug: Actual Faculty ID = {actualFacultyId} | Selected Session = {selectedSessionId}
            </div>
          )}

          {/* Session selector */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Select Session</div>
            {sessionsLoading ? (
              <div className="text-sm text-slate-300">Loading sessions…</div>
            ) : sessionsErr ? (
              <div className="text-sm text-red-400">{sessionsErr}</div>
            ) : acceptedSessions.length === 0 ? (
              <div className="rounded border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
                No accepted sessions available.
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
                    {s.title || "Untitled Session"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Documents display */}
          {!selectedSessionId ? (
            <div className="mt-4 rounded border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
              Choose a session to view documents for that session.
            </div>
          ) : !actualFacultyId ? (
            <div className="mt-4 text-yellow-400 text-xs">
              Getting faculty information...
            </div>
          ) : (
            <>
              {loading && <div className="mt-4 text-sm text-slate-300">Loading documents…</div>}
              {loadErr && <div className="mt-4 text-sm text-red-400">{loadErr}</div>}

              {/* CVs for selected session */}
              <div className="mt-4">
                <div className="text-sm font-medium mb-1">CV for this session</div>
                {cvs.length === 0 ? (
                  <div className="rounded border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
                    No CV uploaded for this session.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvs.map((cv) => (
                      <div
                        key={cv.id}
                        className="flex items-center justify-between rounded border border-slate-800 bg-slate-800/40 p-3"
                      >
                        <div className="text-xs">
                          <div className="font-medium">{cv.originalFilename}</div>
                          <div className="text-slate-400">
                            {(cv.fileSize / (1024 * 1024)).toFixed(2)} MB •{" "}
                            {new Date(cv.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <a href={cv.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              <Eye className="h-4 w-4" /> View
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPickReplaceCv(cv.id)}
                            disabled={workingId === cv.id}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {workingId === cv.id ? "Replacing..." : "Replace"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                            onClick={() => setConfirmDelete({ kind: "cv", id: cv.id })}
                            disabled={workingId === cv.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Presentations for selected session */}
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <Presentation className="h-4 w-4" />
                  <div className="text-sm font-medium">Presentations for this session</div>
                </div>

                {presentations.length === 0 ? (
                  <div className="mt-2 rounded border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
                    No presentations uploaded for this session.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {presentations.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded border border-slate-800 bg-slate-800/40 p-3"
                      >
                        <div className="text-xs">
                          <div className="font-medium">{p.title || p.originalFilename}</div>
                          <div className="text-slate-400">
                            {(p.fileSize / (1024 * 1024)).toFixed(2)} MB •{" "}
                            {new Date(p.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <a href={p.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              <Eye className="h-4 w-4" /> View
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPickReplacePres(p)}
                            disabled={workingId === p.id}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {workingId === p.id ? "Replacing..." : "Replace"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                            onClick={() => setConfirmDelete({ kind: "pres", id: p.id })}
                            disabled={workingId === p.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs">
              {err && <span className="text-red-400">{err}</span>}
              {msg && <span className="text-emerald-400">{msg}</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDesc className="text-slate-400">This action cannot be undone.</AlertDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}