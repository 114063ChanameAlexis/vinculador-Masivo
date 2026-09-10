import type { NextApiRequest, NextApiResponse } from "next";

import { requireValidFlexxusSessionToken } from "@/lib/api-auth";
import { suggestTicketReply } from "@/lib/ai-suggestion";
import type { SuggestionMode } from "@/lib/ai-suggestion";
import { buildTicketAiContext } from "@/lib/flexxus";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  try {
    const body = req.body as {
      token?: string;
      supportId?: string;
      ticketId?: unknown;
      mode?: unknown;
      draftText?: unknown;
    };
    await requireValidFlexxusSessionToken(body.token, body.supportId);

    const ticketId = Number(body.ticketId);
    if (!Number.isFinite(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: "Falta ticketId valido." });
    }

    const mode: SuggestionMode | undefined =
      body.mode === "polish-draft" || body.mode === "polish-with-context" ? body.mode : undefined;

    const ticket = await buildTicketAiContext({
      token: body.token ?? "",
      ticketId,
      includeComments: mode === "polish-with-context",
    });
    const result = await suggestTicketReply({
      ticket,
      mode,
      draftText: typeof body.draftText === "string" ? body.draftText : undefined,
    });

    return res.status(200).json({
      suggestion: result.suggestion,
      ticket: { titulo: ticket.titulo, cliente: ticket.cliente },
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "No se pudo generar la sugerencia." });
  }
}
