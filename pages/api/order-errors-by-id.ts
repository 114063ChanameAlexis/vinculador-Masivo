import type { NextApiRequest, NextApiResponse } from "next";

import { requireValidFlexxusSessionToken } from "@/lib/api-auth";
import { runCloudWatchInsightsQuery } from "@/lib/cloudwatch-logs";
import { buildOtherOrderErrorsQuery, groupOrderErrorRows } from "@/lib/order-error-diagnostics";

const LOG_GROUPS = ["/prod/grow2on/apigateway", "/prod/grow2on/consumer"];
const MAX_LOOKBACK_HOURS = 24;
const DEFAULT_LOOKBACK_HOURS = 2;
const QUERY_LIMIT = 1000;

function clampLookbackHours(value: unknown) {
  const hours = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : DEFAULT_LOOKBACK_HOURS;
  return Math.max(1, Math.min(hours, MAX_LOOKBACK_HOURS));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  try {
    const body = req.body as {
      token?: string;
      supportId?: string;
      serviceId?: unknown;
      lookbackHours?: unknown;
    };
    await requireValidFlexxusSessionToken(body.token, body.supportId);

    const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
    if (!serviceId) {
      return res.status(400).json({ error: "Falta serviceId." });
    }

    const lookbackHours = clampLookbackHours(body.lookbackHours);
    const endTime = Date.now();
    const startTime = endTime - lookbackHours * 60 * 60 * 1000;

    const result = await runCloudWatchInsightsQuery({
      logGroupNames: LOG_GROUPS,
      queryString: buildOtherOrderErrorsQuery({ serviceId, limit: QUERY_LIMIT }),
      startTime,
      endTime,
      limit: QUERY_LIMIT,
    });

    const groups = groupOrderErrorRows(result.rows);

    return res.status(200).json({ groups, totalRows: result.rows.length, lookbackHours });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "No se pudo consultar CloudWatch." });
  }
}
