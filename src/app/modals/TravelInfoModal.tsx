"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Arrangement = "self-arranged" | "preference" | "organizer-provided";
type Mode = "BUS" | "TRAIN" | "FLIGHT" | "CAR" | "OTHER";

type TravelRecord = {
id?: string;
mode: Mode;
arrangement: Arrangement; 
itinerary_path?: string | null;
ticket_path?: string | null;
pnr?: string | null;
preferences?: string | null;
emergency_contact?: string | null;
};

type TravelInfoModalProps = {
open: boolean;
onClose: () => void;
mode: Arrangement; // initial arrangement from parent
eventId?: string; // optional to avoid runtime errors
travelData?: Partial<TravelRecord>;
onSaved?: (data: TravelRecord) => void; // callback after successful save
};

export default function TravelInfoModal({
open,
onClose,
mode,
eventId,
travelData,
onSaved,
}: TravelInfoModalProps) {
const [loading, setLoading] = useState(false);
const [initialLoaded, setInitialLoaded] = useState(false);
const [error, setError] = useState<string | null>(null);

const [form, setForm] = useState<TravelRecord>({
mode: "OTHER",
arrangement: mode,
itinerary_path: "",
ticket_path: "",
pnr: "",
preferences: "",
emergency_contact: "",
});

// Sync initial mode and incoming travelData when modal opens/prop changes
useEffect(() => {
setForm((f) => ({ ...f, arrangement: mode }));
}, [mode]);

// Load existing travel info from backend when opened and eventId exists
useEffect(() => {
let ignore = false;
async function load() {
if (!open) return;
// If no eventId yet, just show the form with defaults and disable save
if (!eventId) {
setInitialLoaded(true);
return;
}
setLoading(true);
setError(null);
try {
const res = await fetch(
  `/api/faculty/travel?event_id=${encodeURIComponent(eventId)}`,
  { method: "GET", credentials: "include" }
);
if (!res.ok) throw new Error("Failed to load travel info");
const data = await res.json();
    if (!ignore) {
      const row = Array.isArray(data?.travel)
        ? data.travel
        : data?.travel;

      if (row) {
        setForm({
          mode: (row.mode as Mode) || "OTHER",
          arrangement: (row.arrangement as Arrangement) || mode,
          itinerary_path: row.itinerary_path ?? "",
          ticket_path: row.ticket_path ?? "",
          pnr: row.pnr ?? "",
          preferences: row.preferences ?? "",
          emergency_contact: row.emergency_contact ?? "",
          id: row.id,
        });
      } else if (travelData) {
        setForm((f) => ({
          ...f,
          ...travelData,
          arrangement: (travelData.arrangement as Arrangement) || mode,
          mode: (travelData.mode as Mode) || f.mode,
        }));
      } else {
        setForm((f) => ({ ...f, arrangement: mode }));
      }
    }
  } catch (e: any) {
    if (!ignore) setError(e?.message || "Could not load travel info.");
  } finally {
    if (!ignore) {
      setLoading(false);
      setInitialLoaded(true);
    }
  }
}

load();
return () => {
  ignore = true;
};
}, [open, eventId, mode, travelData]);

const canSubmit = useMemo(() => {
if (!eventId) return false; // block saving without eventId
if (form.arrangement === "organizer-provided") return true;
return !!form.mode;
}, [eventId, form.arrangement, form.mode]);

function update<K extends keyof TravelRecord>(key: K, val: TravelRecord[K]) {
setForm((f) => ({ ...f, [key]: val }));
}

async function handleSave() {
if (!canSubmit) return;
setLoading(true);
setError(null);
try {
const res = await fetch("/api/faculty/travel", {
method: "POST",
credentials: "include",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
eventId,
mode: form.mode,
arrangement: form.arrangement,
itinerary_path: form.itinerary_path || null,
ticket_path: form.ticket_path || null,
pnr: form.pnr || null,
preferences: form.preferences || null,
emergency_contact: form.emergency_contact || null,
id: form.id, // if your backend upserts by id, keep it; otherwise remove
}),
});
if (!res.ok) {
const msg = await res.json().catch(() => ({}));
throw new Error(msg?.error || "Failed to save travel info");
}
const json = await res.json();
const saved = Array.isArray(json?.travel) ? json.travel : json?.travel;
if (saved) onSaved?.(saved);
onClose();
} catch (e: any) {
setError(e?.message || "Failed to save travel info");
} finally {
setLoading(false);
}
}

return (
<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
<DialogContent className="sm:max-w-lg">
<DialogHeader>
<DialogTitle>Travel Information</DialogTitle>
</DialogHeader>
    {!initialLoaded ? (
      <div className="text-sm text-muted-foreground">Loading...</div>
    ) : (
      <div className="space-y-4">
        {/* Common: Arrangement and Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Arrangement</label>
            <Select
              value={form.arrangement}
              onValueChange={(v: Arrangement) => update("arrangement", v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select arrangement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self-arranged">Self-arranged</SelectItem>
                <SelectItem value="preference">Preference</SelectItem>
                <SelectItem value="organizer-provided">Organizer-provided</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(form.arrangement === "self-arranged" || form.arrangement === "preference") && (
            <div>
              <label className="text-sm font-medium">Mode</label>
              <Select value={form.mode} onValueChange={(v: Mode) => update("mode", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLIGHT">Flight</SelectItem>
                  <SelectItem value="TRAIN">Train</SelectItem>
                  <SelectItem value="BUS">Bus</SelectItem>
                  <SelectItem value="CAR">Car</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Self-arranged: ticket/itinerary/PNR etc */}
        {form.arrangement === "self-arranged" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">PNR / Booking Ref</label>
                <Input
                  value={form.pnr || ""}
                  onChange={(e) => update("pnr", e.target.value)}
                  placeholder="e.g., AB12CD"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Emergency Contact</label>
                <Input
                  value={form.emergency_contact || ""}
                  onChange={(e) => update("emergency_contact", e.target.value)}
                  placeholder="Name and phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Ticket URL/Path</label>
                <Input
                  value={form.ticket_path || ""}
                  onChange={(e) => update("ticket_path", e.target.value)}
                  placeholder="/uploads/tickets/123.pdf or https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Itinerary URL/Path</label>
                <Input
                  value={form.itinerary_path || ""}
                  onChange={(e) => update("itinerary_path", e.target.value)}
                  placeholder="/uploads/itineraries/123.pdf or https://..."
                />
              </div>
            </div>
          </>
        )}

        {/* Preference: just collect preferences and essentials */}
        {form.arrangement === "preference" && (
          <>
            <div>
              <label className="text-sm font-medium">Preferences / Notes</label>
              <Textarea
                value={form.preferences || ""}
                onChange={(e) => update("preferences", e.target.value)}
                placeholder="Seat/meal preferences, timing, special assistance…"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Emergency Contact</label>
              <Input
                value={form.emergency_contact || ""}
                onChange={(e) => update("emergency_contact", e.target.value)}
                placeholder="Name and phone"
              />
            </div>
          </>
        )}

        {/* Organizer-provided: read-only message plus optional notes */}
        {form.arrangement === "organizer-provided" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Travel will be arranged by the organizers. Your details will appear here once available.
            </p>
            <div>
              <label className="text-sm font-medium">Notes to organizer (optional)</label>
              <Textarea
                value={form.preferences || ""}
                onChange={(e) => update("preferences", e.target.value)}
                placeholder="Any special requirements or notes"
                rows={3}
              />
            </div>
          </div>
        )}

        {!eventId && (
          <div className="text-xs text-amber-600">
            Event not selected yet. Please select an event to enable saving.
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    )}

    <DialogFooter className="mt-4">
      <Button variant="outline" onClick={onClose} disabled={loading}>
        Close
      </Button>
      <Button onClick={handleSave} disabled={!canSubmit || loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
);
}