import type { NextApiRequest, NextApiResponse } from "next";

import { requireValidFlexxusSessionToken } from "@/lib/api-auth";
import { runCloudWatchInsightsQuery } from "@/lib/cloudwatch-logs";
import { buildOrderSaleQuery } from "@/lib/order-sale-search";

const LOG_GROUPS = ["/prod/grow2on/apigateway", "/prod/grow2on/consumer"];
const QUERY_LIMIT = 10000;

function parseDate(value: unknown, endOfDay: boolean) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const time = new Date(`${raw}T${endOfDay ? "23:59:59" : "00:00:00"}`).getTime();
  return Number.isFinite(time) ? time : null;
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
      orderId?: unknown;
      serviceId?: unknown;
      dateFrom?: unknown;
      dateTo?: unknown;
    };
    await requireValidFlexxusSessionToken(body.token, body.supportId);

    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return res.status(400).json({ error: "Falta el ID de venta." });
    }

    const startTime = parseDate(body.dateFrom, false);
    if (startTime === null) {
      return res.status(400).json({ error: "Falta o es invalida la fecha desde." });
    }
    const endTime = parseDate(body.dateTo, true) ?? parseDate(body.dateFrom, true) ?? startTime;

    const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";

    const result = await runCloudWatchInsightsQuery({
      logGroupNames: LOG_GROUPS,
      queryString: buildOrderSaleQuery({ orderId, serviceId: serviceId || undefined }),
      startTime,
      endTime,
      limit: QUERY_LIMIT,
    });

    return res.status(200).json({ rows: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "No se pudo consultar CloudWatch." });
  }
}
