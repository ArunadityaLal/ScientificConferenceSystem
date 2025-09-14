import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { query } from "@/lib/database/connection";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.id as string;

  // Accept eventId from body (POST) or query (GET)
  const eventId = (req.body?.eventId || req.query?.event_id) as string;
  if (!eventId) return res.status(400).json({ error: "eventId required" });

  if (req.method === "GET") {
    try {
      const result = await query(
        "SELECT * FROM accommodations WHERE user_id=$1 AND event_id=$2",
        [userId, eventId]
      );
      return res.status(200).json({ accommodation: result.rows || null });
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: "Failed to fetch accommodation info", detail: err.message });
    }
  }

  if (req.method === "POST") {
    const {
      hotel, // string | null
      check_in, // timestamp/date string | null
      check_out, // timestamp/date string | null
      preferences, // json/text | null
      arrangement, // enum/text, e.g., "self"/"company" | null
      special_requests, // text | null
    } = req.body;

    try {
      const upsert = await query(
        `
    INSERT INTO accommodations
      (id, user_id, event_id, hotel, check_in, check_out, preferences, arrangement, special_requests, created_at, updated_at)
    VALUES
      (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, event_id)
    DO UPDATE SET
      hotel = EXCLUDED.hotel,
      check_in = EXCLUDED.check_in,
      check_out = EXCLUDED.check_out,
      preferences = EXCLUDED.preferences,
      arrangement = EXCLUDED.arrangement,
      special_requests = EXCLUDED.special_requests,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
        [userId, eventId, hotel, check_in, check_out, preferences, arrangement, special_requests]
      );
      return res.status(200).json({ accommodation: upsert.rows });
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: "Failed to save accommodation info", detail: err.message });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}