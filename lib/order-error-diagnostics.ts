import type { CloudWatchInsightsRow } from "@/lib/cloudwatch-logs";

export type OrderErrorFamily =
  | "Producto / item pedido"
  | "Parametros Flexxus / cliente"
  | "Cliente / alta cliente"
  | "Defecto codigo"
  | "Origen marketplace / payload"
  | "Otros";

export type OrderErrorGroup = {
  key: string;
  client: string;
  family: OrderErrorFamily;
  message: string;
  serviceIds: string[];
  correlationIds: string[];
  sources: string[];
  count: number;
};

export function buildOtherOrderErrorsQuery(input: { serviceId?: string; limit?: number }) {
  const limit = Math.max(1, Math.min(Math.floor(input.limit ?? 1000), 1000));
  const filters = [
    "| filter level = 'ERROR' and tag = 'orders' and message != 'Missing product linkage required to associate it with the order.'",
  ];
  if (input.serviceId?.trim()) {
    const serviceId = input.serviceId.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    filters.push(`| filter serviceId = "${serviceId}"`);
  }
  return [
    "fields @log, @timestamp, @ingestionTime, level, tag, message, details.database, details.message, details.error, details.orderId, details.productId, serviceId, correlationId, @logStream, @message",
    ...filters,
    "| sort @timestamp desc",
    `| limit ${limit}`,
  ].join("\n");
}

function parseMaybeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function stringifyError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const record = item as Record<string, unknown>;
      const restriction = record.restriccion && typeof record.restriccion === "object"
        ? Object.values(record.restriccion as Record<string, unknown>).map(String).join(" | ")
        : "";
      return [record.propiedad, record.valor, restriction].filter((part) => part !== undefined && part !== "").map(String).join(": ");
    }).filter(Boolean).join(" | ");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return stringifyError(record.message ?? record.error ?? record.data ?? JSON.stringify(value));
  }
  return value === undefined || value === null ? "" : String(value);
}

function orderErrorText(row: CloudWatchInsightsRow) {
  const raw = (row["details.error"] || row["details.message"] || row.message || "Error sin detalle").trim();
  const parsed = parseMaybeJson(raw);
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : undefined;
    return stringifyError(data?.message ?? record.message ?? record.error ?? raw) || raw;
  }
  return raw;
}

function classifyOrderError(message: string): OrderErrorFamily {
  const text = message.toLowerCase();
  if (
    text.includes("codigoarticulo")
    || text.includes("preciototal")
    || text.includes("talle")
    || text.includes("categories")
    || text.includes("producto")
    || text.includes("articulo")
  ) return "Producto / item pedido";
  if (
    text.includes("multiplazo")
    || text.includes("codigoestadomora")
    || text.includes("codigobanco")
    || text.includes("codigo cobrador")
    || text.includes("email")
    || text.includes("cae")
    || /\bfecha[1-6]\b/i.test(message)
  ) return "Parametros Flexxus / cliente";
  if (
    text.includes("cliente se encuentra repetido")
    || text.includes("cliente informado existe")
    || text.includes("problem creating the customer")
    || text.includes("creating the customer")
  ) return "Cliente / alta cliente";
  if (
    text.includes("cannot read property")
    || text.includes("cannot read properties")
    || text.includes("assignment to constant variable")
    || text.includes("typeerror")
    || text.includes("null")
  ) return "Defecto codigo";
  if (
    text.includes("pack_orders_ids")
    || text.includes("standardizeorder")
    || text.includes("mercado libre")
    || text.includes("payload")
  ) return "Origen marketplace / payload";
  return "Otros";
}

function normalizeErrorKey(value: string) {
  return value
    .replace(/\b[0-9a-f]{8,}-[0-9a-f-]{8,}\b/gi, "{uuid}")
    .replace(/\b\d+\b/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220)
    .toLowerCase();
}

function logSource(row: CloudWatchInsightsRow) {
  const value = row["@log"] || "";
  if (value.includes("/consumer")) return "Consumer";
  if (value.includes("/apigateway")) return "Gateway";
  return value || "-";
}

// Version minima: sin lookup de Service Manager, asi que el "cliente" de cada
// grupo solo sale de details.database (si el log lo trae). Sin eso, queda
// "Sin cliente identificado".
function clientOf(row: CloudWatchInsightsRow) {
  const database = (row["details.database"] || "").trim();
  return database || "Sin cliente identificado";
}

export function groupOrderErrorRows(rows: CloudWatchInsightsRow[]): OrderErrorGroup[] {
  const groups = new Map<string, OrderErrorGroup>();
  for (const row of rows) {
    const client = clientOf(row);
    const message = orderErrorText(row);
    const family = classifyOrderError(message);
    const serviceId = (row.serviceId || "").trim();
    const key = `${serviceId}|${family}|${normalizeErrorKey(message)}`;
    const existing = groups.get(key);
    const correlationId = (row.correlationId || "").trim();
    const source = logSource(row);
    if (existing) {
      existing.count += 1;
      if (serviceId && !existing.serviceIds.includes(serviceId)) existing.serviceIds.push(serviceId);
      if (correlationId && !existing.correlationIds.includes(correlationId)) existing.correlationIds.push(correlationId);
      if (source && !existing.sources.includes(source)) existing.sources.push(source);
      continue;
    }
    groups.set(key, {
      key,
      client,
      family,
      message,
      serviceIds: serviceId ? [serviceId] : [],
      correlationIds: correlationId ? [correlationId] : [],
      sources: source ? [source] : [],
      count: 1,
    });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.client.localeCompare(b.client));
}
