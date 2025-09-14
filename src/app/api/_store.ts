export type InviteStatus = "Pending" | "Accepted" | "Declined";

export interface Session {
  id: string;
  title: string;
  facultyId: string;
  email: string;
  place: string;
  roomId: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: InviteStatus;
  roomName?: string;

  // Decline/response-related fields (used by faculty dashboard and organizer views)
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;

  // Optional travel fields used elsewhere in your routes
  travelStatus?: string;

  // Optional poster fields used in /api/sessions
  posterCid?: string;
  posterFilename?: string;
  posterContentType?: string;
  posterDataBase64?: string;

  // Optional token (if you use invite links)
  inviteToken?: string;
}

type StoreShape = { sessions: Session[] };

// Use a global singleton store so it persists during dev hot-reloads
const globalStore = (globalThis as any).__SESSIONS_STORE__ as
  | StoreShape
  | undefined;

const STORE: StoreShape =
  globalStore ?? ((globalThis as any).__SESSIONS_STORE__ = { sessions: [] });

// READ: return current sessions
export async function getSessions(): Promise<Session[]> {
  return STORE.sessions;
}

// REPLACE: set entire sessions array (expects fully-typed Session[])
export async function setSessions(sessions: Session[]): Promise<void> {
  STORE.sessions = sessions;
}

// CREATE: add a fully-typed Session
export async function addSession(session: Session): Promise<void> {
  STORE.sessions.push(session);
}

// UPDATE: safely merge with existing by id; preserves required fields
export async function updateSession(
  id: string,
  updates: Partial<Session>
): Promise<void> {
  const idx = STORE.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const current = STORE.sessions[idx];
  if (!current) return;

  const next: Session = {
    id: updates.id ?? current.id,
    title: updates.title ?? current.title,
    facultyId: updates.facultyId ?? current.facultyId,
    email: updates.email ?? current.email,
    place: updates.place ?? current.place,
    roomId: updates.roomId ?? current.roomId,
    description: updates.description ?? current.description,
    startTime: updates.startTime ?? current.startTime,
    endTime: updates.endTime ?? current.endTime,
    status: updates.status ?? current.status,
    inviteStatus: updates.inviteStatus ?? current.inviteStatus,
    roomName: updates.roomName ?? current.roomName,

    rejectionReason: updates.rejectionReason ?? current.rejectionReason,
    suggestedTopic: updates.suggestedTopic ?? current.suggestedTopic,
    suggestedTimeStart:
      updates.suggestedTimeStart ?? current.suggestedTimeStart,
    suggestedTimeEnd: updates.suggestedTimeEnd ?? current.suggestedTimeEnd,
    optionalQuery: updates.optionalQuery ?? current.optionalQuery,

    travelStatus: updates.travelStatus ?? current.travelStatus,

    posterCid: updates.posterCid ?? current.posterCid,
    posterFilename: updates.posterFilename ?? current.posterFilename,
    posterContentType: updates.posterContentType ?? current.posterContentType,
    posterDataBase64: updates.posterDataBase64 ?? current.posterDataBase64,

    inviteToken: updates.inviteToken ?? current.inviteToken,
  };

  STORE.sessions[idx] = next;
}

// DELETE: remove by id
export async function deleteSession(id: string): Promise<void> {
  STORE.sessions = STORE.sessions.filter((s) => s.id !== id);
}

// READ ONE: get by id
export async function getSessionById(id: string): Promise<Session | undefined> {
  return STORE.sessions.find((s) => s.id === id);
}

// READ BY EMAIL: filter by faculty email (case-insensitive)
export async function getSessionsByEmail(email: string): Promise<Session[]> {
  return STORE.sessions.filter(
    (s) => s.email.toLowerCase() === email.toLowerCase()
  );
}
