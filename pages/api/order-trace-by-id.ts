import type { NextApiRequest, NextApiResponse } from "next";

import { requireValidFlexxusSessionToken } from "@/lib/api-auth";
import { runCloudWatchInsightsQuery } from "@/lib/cloudwatch-logs";
import { buildOrderTraceQuery } from "@/lib/order-error-diagnostics";

const LOG_GROUPS = ["/prod/grow2on/apigateway", "/prod/grow2on/consumer"];
// El correlationId ya identifica un caso puntual, asi que buscamos en una ventana
// amplia fija en vez de depender de que el agente calcule el rango correcto.
const LOOKBACK_HOURS = 24 * 14;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  try {
    const body = req.body as {
      token?: string;
      supportId?: string;
      correlationId?: unknown;
    };
    await requireValidFlexxusSessionToken(body.token, body.supportId);

    const correlationId = typeof body.correlationId === "string" ? body.correlationId.trim() : "";
    if (!correlationId) {
      return res.status(400).json({ error: "Falta correlationId." });
    }

    const endTime = Date.now();
    const startTime = endTime - LOOKBACK_HOURS * 60 * 60 * 1000;

    const result = await runCloudWatchInsightsQuery({
      logGroupNames: LOG_GROUPS,
      queryString: buildOrderTraceQuery(correlationId),
      startTime,
      endTime,
      limit: 200,
    });

    return res.status(200).json({ rows: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "No se pudo consultar CloudWatch." });
  }
}
