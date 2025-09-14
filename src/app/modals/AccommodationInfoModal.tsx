"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Arrangement = "self-arranged" | "preference" | "organizer-provided";

type HotelOption = {
  id: string;
  name: string;
  location?: string;
};

type AccommodationData = {
  hotel?: string | null;
  check_in?: string | null; // yyyy-mm-dd
  check_out?: string | null; // yyyy-mm-dd
  arrangement?: Arrangement | string | null;
  preferences?: any;
  special_requests?: string | null;
  receipt_path?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;

  // Event gating (required to enable Save)
  eventId?: string | null;

  initialArrangement?: Arrangement; // default arrangement
  accommodationData?: AccommodationData | null;
  hotelOptions?: HotelOption[];

  onUpload?: (file: File) => Promise<void> | void;
  onPreferenceSelect?: (option: HotelOption) => void;
  onSubmit?: (payload: {
    arrangement: Arrangement;
    hotel?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    preferences?: any;
    special_requests?: string | null;
  }) => Promise<void> | void;

  submitting?: boolean;
};

export default function AccommodationInfoModal({
  open,
  onClose,
  eventId,
  initialArrangement,
  accommodationData,
  hotelOptions = [],
  onUpload,
  onPreferenceSelect,
  onSubmit,
  submitting = false,
}: Props) {
  // Visual parity with Travel Info modal: container spacing inside DialogContent
  // State
  const [arrangement, setArrangement] = useState<Arrangement>(
    (accommodationData?.arrangement as Arrangement) ||
      initialArrangement ||
      "self-arranged"
  );
  const [hotel, setHotel] = useState<string>(accommodationData?.hotel ?? "");
  const [checkIn, setCheckIn] = useState<string>(
    toYMD(accommodationData?.check_in)
  );
  const [checkOut, setCheckOut] = useState<string>(
    toYMD(accommodationData?.check_out)
  );
  const [preferenceText, setPreferenceText] = useState<string>(
    typeof accommodationData?.preferences === "string"
      ? accommodationData?.preferences
      : ""
  );
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>(
    accommodationData?.special_requests ?? ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localUploading, setLocalUploading] = useState<boolean>(false);

  useEffect(() => {
    setArrangement(
      (accommodationData?.arrangement as Arrangement) ||
        initialArrangement ||
        "self-arranged"
    );
    setHotel(accommodationData?.hotel ?? "");
    setCheckIn(toYMD(accommodationData?.check_in));
    setCheckOut(toYMD(accommodationData?.check_out));
    setPreferenceText(
      typeof accommodationData?.preferences === "string"
        ? accommodationData?.preferences
        : ""
    );
    setSelectedHotelId("");
    setSpecialRequests(accommodationData?.special_requests ?? "");
    setErrors({});
  }, [open, accommodationData, initialArrangement]);

  const minCheckIn = useMemo(() => todayYMD(), []);
  const minCheckOut = useMemo(
    () => (checkIn ? checkIn : todayYMD()),
    [checkIn]
  );

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (arrangement === "self-arranged") {
      if (!hotel?.trim()) e.hotel = "Hotel name is required.";
      if (!checkIn) e.checkIn = "Check-in date is required.";
      if (!checkOut) e.checkOut = "Check-out date is required.";
    }
    if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn)) {
      e.checkOut = "Check-out must be after check-in.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!onUpload) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setLocalUploading(true);
      if (files[0]) {
        await onUpload(files[0]);
      }
    } finally {
      setLocalUploading(false);
      e.target.value = "";
    }
  }

  function selectedOption(): HotelOption | undefined {
    return hotelOptions.find((h) => h.id === selectedHotelId);
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!eventId) return; // guard (Save is already disabled, but keep it safe)
    const payload = {
      arrangement,
      hotel:
        arrangement === "self-arranged"
          ? hotel
          : hotelOptions.length > 0 && selectedOption()
          ? selectedOption()!.name
          : preferenceText || accommodationData?.hotel || null,
      check_in: checkIn || null,
      check_out: checkOut || null,
      preferences:
        arrangement === "preference"
          ? hotelOptions.length > 0
            ? selectedOption()
              ? { selectedHotelId }
              : preferenceText || null
            : preferenceText || null
          : null,
      special_requests: specialRequests || null,
    };
    await onSubmit?.(payload);
  }

  const isEventMissing = !eventId;
  const baseCanSubmit =
    arrangement === "organizer-provided"
      ? false
      : arrangement === "self-arranged"
      ? Boolean(hotel?.trim() && checkIn && checkOut)
      : Boolean(
          selectedHotelId ||
            preferenceText.trim() ||
            checkIn ||
            checkOut ||
            specialRequests.trim()
        );
  const canSubmit =
    !submitting && !localUploading && baseCanSubmit && !isEventMissing;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl rounded-xl shadow-lg">
        <DialogTitle className="text-lg font-semibold tracking-tight">
          Accommodation
        </DialogTitle>

        <div className="space-y-6">
          {/* Arrangement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Arrangement">
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                value={arrangement}
                onChange={(e) => setArrangement(e.target.value as Arrangement)}
              >
                <option value="self-arranged">Self-arranged</option>
                <option value="preference">Share preference</option>
                <option value="organizer-provided">Organizer-provided</option>
              </select>
            </Field>
          </div>

          {/* Event missing warning */}
          {isEventMissing && (
            <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
              Event not selected yet. Please select an event to enable saving.
            </div>
          )}

          {/* Self-arranged */}
          {arrangement === "self-arranged" && (
            <div className="space-y-4 border-t pt-4">
              <Field label="Hotel Name" error={errors.hotel}>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                  placeholder="Enter hotel name"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Check-in Date"
                  error={errors.checkIn}
                  helper={`Earliest: ${minCheckIn}`}
                >
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    min={minCheckIn}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </Field>
                <Field
                  label="Check-out Date"
                  error={errors.checkOut}
                  helper={checkIn ? `After ${checkIn}` : undefined}
                >
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    min={minCheckOut}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Upload Receipt/Booking (PDF or Image)">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary/90"
                  onChange={handleFileChange}
                  disabled={!onUpload || localUploading}
                />
                {!onUpload && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload disabled (no onUpload handler provided).
                  </p>
                )}
              </Field>

              <Field label="Special Requests (optional)">
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g., Late check-in, non-smoking room"
                />
              </Field>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Close
            </Button>
            {arrangement !== "organizer-provided" && (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  helper,
  children,
}: {
  label?: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}

// Utils (same as fixed version earlier)
// ...existing code...

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toYMD(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
