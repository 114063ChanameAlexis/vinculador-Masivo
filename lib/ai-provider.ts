import { readFile } from "node:fs/promises";
import path from "node:path";

const DEEPSEEK_TEXT_MODEL = "deepseek-v4-flash";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const localKeyPath = path.join(process.cwd(), ".deepseek-key");
const debugAiLogs = process.env.AI_DEBUG_LOGS === "true";

export type ChatMessage = {
  role: "system" | "user";
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
};

type DeepSeekPayload = {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  error?: { message?: string };
};

export async function getDeepSeekApiKey() {
  const envKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (envKey) return envKey;
  try {
    return (await readFile(localKeyPath, "utf8")).trim() || null;
  } catch {
    return null;
  }
}

function redactImagesFromMessages(messages: ChatMessage[]) {
  return messages.map((message) => {
    if (typeof message.content === "string") return message;
    return {
      ...message,
      content: message.content.map((part) => (part.type === "text" ? part : { type: "image_url" as const, image_url: { url: "[IMAGEN_BASE64]" } })),
    };
  });
}

export async function callDeepSeek(input: {
  apiKey: string;
  messages: ChatMessage[];
  maxTokens: number;
  model?: string;
  temperature?: number;
  topP?: number;
  reasoning?: boolean;
  label?: string;
}) {
  const requestPayload = {
    model: input.model ?? DEEPSEEK_TEXT_MODEL,
    messages: input.messages,
    max_tokens: input.maxTokens,
    temperature: input.temperature ?? 0.2,
    top_p: input.topP ?? 0.7,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: false,
    // deepseek-v4 razona por defecto y consume tokens de salida en el razonamiento.
    // Lo desactivamos salvo que se pida explicitamente, para ahorrar tokens.
    ...(input.reasoning ? {} : { thinking: { type: "disabled" } }),
  };
  const label = input.label ?? "ai";
  if (debugAiLogs) {
    console.log(`[${label}] Payload DeepSeek:`, JSON.stringify({ ...requestPayload, messages: redactImagesFromMessages(requestPayload.messages) }, null, 2));
  }
  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(requestPayload),
    cache: "no-store",
  });
  const responseText = await response.text();
  if (debugAiLogs) {
    console.log(`[${label}] Respuesta DeepSeek:`, JSON.stringify({ status: response.status, ok: response.ok, body: responseText.slice(0, 2000) }, null, 2));
  }
  let payload: DeepSeekPayload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`DeepSeek devolvio una respuesta no JSON: ${responseText.slice(0, 500)}`);
  }
  if (!response.ok) throw new Error(payload.error?.message ?? "DeepSeek no pudo generar la respuesta.");
  const candidate = payload.choices?.[0];
  const content = candidate?.message?.content?.trim();
  if (!content) throw new Error(`DeepSeek no devolvio contenido. finishReason=${candidate?.finish_reason ?? "sin-candidato"}`);
  if (candidate?.finish_reason === "length") throw new Error("DeepSeek corto la respuesta por limite de tokens.");
  return content;
}

export function stripJsonFences(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}
