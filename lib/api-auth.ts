import { buildFirstResponseTicketsEndpoint, buildManagementTicketsEndpoint } from "@/lib/support-config";

function requireSessionToken(token: string | null | undefined) {
  if (!token?.trim()) {
    throw new Error("Falta token de sesion para consultar este recurso.");
  }
}

const TOKEN_VALIDATION_TTL_MS = 2 * 60 * 1000;
const tokenValidationCache = new Map<string, { ok: boolean; expiresAt: number }>();

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function findNestedStringValue(input: unknown, keys: string[]): string | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  for (const value of Object.values(record)) {
    const nested = findNestedStringValue(value, keys);
    if (nested) return nested;
  }
  return null;
}

function isLocallyValidFlexxusJwt(token: string, supportId: string) {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (!exp || exp * 1000 <= Date.now()) return false;
  const tokenSupportId = findNestedStringValue(payload, ["id", "id_usuario", "idUsuario"]);
  return tokenSupportId === supportId;
}

export async function requireValidFlexxusSessionToken(token: string | null | undefined, supportId: string | null | undefined) {
  requireSessionToken(token);
  if (!supportId?.trim()) throw new Error("Falta ID de agente para validar la sesion.");
  const cleanToken = token?.trim() ?? "";
  const cleanSupportId = supportId.trim();
  if (isLocallyValidFlexxusJwt(cleanToken, cleanSupportId)) return;
  const cacheKey = `${cleanSupportId}:${cleanToken}`;
  const cached = tokenValidationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.ok) throw new Error("Token de sesion invalido.");
    return;
  }

  const endpoints = [
    buildFirstResponseTicketsEndpoint(cleanSupportId),
    buildManagementTicketsEndpoint(cleanSupportId),
  ];
  let ok = false;
  let authRejected = false;
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${cleanToken}` },
      cache: "no-store",
    });
    if (response.ok) {
      ok = true;
      break;
    }
    if (response.status === 401 || response.status === 403) authRejected = true;
  }
  tokenValidationCache.set(cacheKey, { ok, expiresAt: Date.now() + TOKEN_VALIDATION_TTL_MS });
  if (!ok) throw new Error(authRejected ? "Token de sesion invalido." : "No se pudo validar la sesion contra Flexxus.");
}
