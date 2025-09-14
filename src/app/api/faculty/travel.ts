import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { query } from "@/lib/database/connection";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.id as string;
  const eventId = (req.body?.eventId || req.query?.event_id) as string; 
  if (!eventId) return res.status(400).json({ error: "eventId required" });

  if (req.method === "GET") {
    try {
      const result = await query(
        "SELECT * FROM travel_details WHERE user_id=$1 AND event_id=$2",
        [userId, eventId]
      );
      return res.status(200).json({ travel: result.rows[0] || null });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch travel info", detail: err.message });
    }
  }

  if (req.method === "POST") {
    const {
      mode,
      arrangement,
      itinerary_path,
      ticket_path,
      pnr,
      preferences,
      emergency_contact,
    } = req.body;

    try {
      const upsert = await query(`
        INSERT INTO travel_details
        (id, user_id, event_id, mode, arrangement, itinerary_path, ticket_path, pnr, preferences, emergency_contact, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, event_id)
        DO UPDATE SET
          mode=$3,
          arrangement=$4,
          itinerary_path=$5,
          ticket_path=$6,
          pnr=$7,
          preferences=$8,
          emergency_contact=$9,
          updated_at=CURRENT_TIMESTAMP
        RETURNING *
      `, [userId, eventId, mode, arrangement, itinerary_path, ticket_path, pnr, preferences, emergency_contact]);
      return res.status(200).json({ travel: upsert.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to save travel info", detail: err.message });
    }
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
