import { callDeepSeek, getDeepSeekApiKey, type ChatMessage } from "@/lib/ai-provider";
import type { TicketDetail } from "@/lib/flexxus";

const SUPPORT_AGENT_ROLE = "Sos un agente de soporte Sincro eCommerce de Grow2On/Wuala. Tu especialidad es asistir a clientes sobre sincronización, publicaciones, ventas, stock, pedidos e integraciones de canales.";
export const ARGENTINA_SPANISH_RULE = "Usá español profesional de Argentina/rioplatense, con ortografía y tildes correctas. Evitá español neutro o peninsular como tienes, puedes, debes, indícanos, indícale, vosotros, os, vale. Preferí fórmulas naturales como tenés, podés, nos podrías indicar, necesitamos que nos compartas o vamos a revisar.";

export type SuggestionMode = "polish-draft";

function sanitizeText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    .replace(/\b(tel|telefono|cel|celular|whatsapp)\b\.?\s*[:=]?\s*(?:\+?\d[\d\s().-]{7,}\d)/gi, "$1 [TELEFONO]")
    .replace(/\b(password|pass|clave|contrasena|usuario|user|admin|acceso)\b\s*[:=]?\s*\S+/gi, "$1 [DATO_SENSIBLE]");
}

function truncateText(value: string | null | undefined, limit: number) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit).trimEnd()}...`;
}

function getFirstName(value: string | null | undefined) {
  return (value ?? "").trim().split(/\s+/)[0] || "cliente";
}

function getBuenosAiresGreeting() {
  const parts = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(new Date());
  const hourText = parts.find((part) => part.type === "hour")?.value ?? "0";
  const hour = Number(hourText) % 24;
  return hour < 13 ? "Buenos dias" : "Buenas tardes";
}

const SIGNATURE = ["Saludos cordiales.", "Area eCommerce Wuala - Soporte Sincro."];

function buildDraftPolishMessages(ticket: TicketDetail, draftText: string): ChatMessage[] {
  const saludo = getBuenosAiresGreeting();
  return [
    {
      role: "system",
      content: JSON.stringify({
        rol: SUPPORT_AGENT_ROLE,
        obj: "Convertir el texto escrito por el agente en una respuesta profesional completa para enviar al cliente.",
        reglas: [
          "Devolve solo el texto pulido, sin explicaciones.",
          "Conserva la idea, intencion y datos escritos por el agente. No cambies el sentido.",
          "Puede ordenar mejor, explicar con mas claridad y agregar conectores profesionales si ayudan a que el cliente entienda.",
          "Si el texto original es muy breve o tipo apunte, desarrollalo en 2 o 3 frases profesionales sin inventar: explica el criterio operativo, el seguimiento y el proximo aviso.",
          "Cuando el agente mencione varios tickets o temas separados, aclarar que cada tema se esta siguiendo en su ticket correspondiente para mantener la trazabilidad.",
          ARGENTINA_SPANISH_RULE,
          "Corregi ortografia, tildes, puntuacion, mayusculas, cortes de parrafo y errores claros de tipeo.",
          `Debe empezar con este saludo exacto segun hora de Buenos Aires: "${saludo}, {primer nombre del cliente}." No uses el otro saludo.`,
          "Debe incluir una linea en blanco despues del saludo.",
          "Debe terminar con la firma exacta: Saludos cordiales. / Area eCommerce Wuala - Soporte Sincro.",
          "Si el texto original ya trae saludo o firma, reemplazalos por el saludo horario correcto y la firma exacta, sin duplicarlos.",
          "No agregues diagnosticos, causas, promesas, acciones realizadas, horarios ni datos que el agente no escribio o que el ticket no confirme.",
          "No cambies el sentido de frases prudentes por afirmaciones mas fuertes.",
        ],
        firma: SIGNATURE,
      }),
    },
    {
      role: "user",
      content: [{
        type: "text",
        text: JSON.stringify({
          textoOriginal: sanitizeText(draftText),
          ticket: {
            id: ticket.id,
            titulo: truncateText(sanitizeText(ticket.titulo), 120),
            cliente: getFirstName(ticket.cliente),
          },
        }),
      }],
    },
  ];
}

function normalizeForPolicy(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function removeDuplicateOpeningGreeting(value: string) {
  const lines = value.trim().split(/\r?\n/);
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim());
  if (firstNonEmptyIndex < 0) return value.trim();
  const secondNonEmptyIndex = lines.findIndex((line, index) => index > firstNonEmptyIndex && line.trim());
  if (secondNonEmptyIndex < 0) return value.trim();

  const firstLine = normalizeForPolicy(lines[firstNonEmptyIndex].trim());
  const secondLine = normalizeForPolicy(lines[secondNonEmptyIndex].trim());
  const repeatedGreeting = firstLine === secondLine && /^(buenos dias|buenas tardes),?\s+.+\.$/.test(firstLine);
  if (!repeatedGreeting) return value.trim();

  return lines
    .filter((_, index) => index !== secondNonEmptyIndex)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Red de validacion liviana, sin costo de API: corrige las formas peninsulares
// mas comunes a voseo rioplatense y garantiza la firma al final.
const RIOPLATENSE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpuedes\b/gi, "podés"],
  [/\btienes\b/gi, "tenés"],
  [/\bdebes\b/gi, "debés"],
  [/\bquieres\b/gi, "querés"],
  [/\bnecesitas\b/gi, "necesitás"],
  [/\bhaces\b/gi, "hacés"],
];

function applyRioplatenseFixes(value: string) {
  let out = value;
  for (const [pattern, replacement] of RIOPLATENSE_REPLACEMENTS) {
    out = out.replace(pattern, (match) =>
      match[0] === match[0].toUpperCase()
        ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
        : replacement,
    );
  }
  return out;
}

function ensureSignature(value: string) {
  const trimmed = value.trim();
  if (normalizeForPolicy(trimmed).endsWith(normalizeForPolicy(SIGNATURE.join("\n")))) return trimmed;
  // Quita una firma parcial o mal escrita al final y repone la canonica exacta.
  const signatureLines = new Set(SIGNATURE.map((line) => normalizeForPolicy(line).replace(/\.$/, "")));
  const lines = trimmed.split(/\r?\n/);
  while (lines.length) {
    const last = normalizeForPolicy(lines[lines.length - 1].trim()).replace(/\.$/, "");
    if (last === "" || signatureLines.has(last)) {
      lines.pop();
      continue;
    }
    break;
  }
  return `${lines.join("\n").trim()}\n\n${SIGNATURE.join("\n")}`;
}

function enforceReplyPolicy(value: string) {
  return ensureSignature(applyRioplatenseFixes(removeDuplicateOpeningGreeting(value)));
}

export async function suggestTicketReply(input: { ticket: TicketDetail; mode?: SuggestionMode; draftText?: string }) {
  const apiKey = await getDeepSeekApiKey();
  if (!apiKey) throw new Error("Falta configurar DEEPSEEK_API_KEY o crear el archivo .deepseek-key.");

  if (input.mode === "polish-draft") {
    const draftText = sanitizeText(input.draftText);
    if (!draftText) throw new Error("Falta el texto para pulir.");
    const content = await callDeepSeek({
      apiKey,
      messages: buildDraftPolishMessages(input.ticket, draftText),
      maxTokens: 620,
      label: "ai-polish-draft",
    });
    return { suggestion: enforceReplyPolicy(content) };
  }

  throw new Error(`Modo de sugerencia no soportado: ${input.mode ?? "sin modo"}.`);
}
