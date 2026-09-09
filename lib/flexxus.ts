const BASE_URL = "https://soporte.flexxus.com.ar/api";

type FlexxusTicketListItem = {
  id: number;
  titulo: string;
  id_cliente_asignado?: number | string | null;
  id_servicio?: number | string | null;
  servicio?: number | string | { id?: number | string | null; nombre?: string | null } | null;
  id_tipo_solicitud?: number | string | null;
  id_prioridad?: number | string | null;
  id_equipo?: number | string | null;
  id_usuario_asignado?: number | string | null;
  id_empresa?: number | string | null;
  id_estado?: number | string | null;
  estado_id?: number | string | null;
  estado?: { id?: number | string | null; nombre?: string | null } | string | null;
  ticketEstado?: { id?: number | string | null; nombre?: string | null } | null;
  ticketsEstados?: { id?: number | string | null; nombre?: string | null } | null;
  fecha_modificacion: string | null;
  usuarioAsignado?: { nombre?: string; apellido?: string };
  cliente?: { id?: number | string | null; nombre?: string; apellido?: string };
  empresa?: { id?: number | string | null; nombre?: string };
};

export type FlexxusTicketDetail = {
  descripcion?: string | null;
  id_cliente_asignado?: number | string | null;
  id_servicio?: number | string | null;
  servicio?: number | string | { id?: number | string | null; nombre?: string | null } | null;
  id_tipo_solicitud?: number | string | null;
  id_prioridad?: number | string | null;
  id_equipo?: number | string | null;
  id_usuario_asignado?: number | string | null;
  id_categoria?: number | string | null;
  categoria?: { value?: number | string | null; id?: number | string | null; title?: string | null; nombre?: string | null } | string | null;
  Categorium?: { value?: number | string | null; id?: number | string | null; title?: string | null; nombre?: string | null } | null;
};

export type FlexxusTicketSla = {
  id: number;
  vencimiento_1: string | null;
  vencimiento_2: string | null;
  cumplido: number | boolean | null;
  porcentaje_cumplido: number | null;
  id_sla: number;
  id_ticket: number;
  Sla?: {
    id: number;
    titulo?: string | null;
    hora?: number | null;
    sla_tipo?: number | null;
  };
};

export type FlexxusCategoryNode = {
  value: number;
  title: string;
  id_categoria_madre: number | null;
  children?: FlexxusCategoryNode[];
};

export type FlexxusComment = {
  id: number;
  fecha_creacion: string;
  respuesta: string;
  es_solucion: boolean;
  es_visible?: boolean | number | string | null;
  esVisible?: boolean | number | string | null;
  visible?: boolean | number | string | null;
  interno?: boolean | number | string | null;
  usuarioRespuesta?: {
    nombre?: string;
    apellido?: string;
    usuariosTipos?: { nombre?: string };
  };
};

export type FlexxusTicketAttachment = {
  id?: number | string | null;
  ruta?: string | null;
  id_ticket?: number | string | null;
  id_respuesta?: number | string | null;
  id_observacion?: number | string | null;
  id_articulo_conocimiento?: number | string | null;
};

export type TicketListItem = {
  id: number;
  titulo: string;
  asignado: string;
  cliente: string;
  clienteId?: number | null;
  empresa: string;
  empresaId?: number | null;
  servicioId?: number | null;
  tipoSolicitudId?: number | null;
  prioridadId?: number | null;
  equipoId?: number | null;
  usuarioAsignadoId?: number | null;
  estadoId: string | null;
  estadoNombre: string | null;
  fechaModificacion: string | null;
  categoria?: TicketCategoryMetadata;
  slas?: TicketSlaMetadata[];
};

type TicketComment = {
  id: number;
  autor: string;
  tipoAutor: "agente" | "cliente";
  fecha: string;
  contenido: string;
  imagenes: TicketImage[];
  esSolucion: boolean;
  esInterno: boolean;
};

export type TicketImage = {
  id: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
};

export type TicketContentBlock =
  | { type: "text"; id: string; text: string }
  | { type: "image"; id: string; image: TicketImage };

type TicketAttachment = {
  id: number | null;
  nombre: string;
  ruta: string;
  extension: string | null;
  tipo: "image" | "file";
  ticketId: number | null;
  responseId: number | null;
  url: string;
};

type TicketCategoryMetadata = {
  id: string | null;
  nombre: string | null;
  ruta: string | null;
};

type TicketSlaMetadata = {
  id: number;
  titulo: string;
  tipo: "respuesta" | "resolucion" | "otro";
  vencimiento: string | null;
  cumplido: boolean;
  porcentajeCumplido: number | null;
  horas: number | null;
};

export type TicketDetail = TicketListItem & {
  descripcion: string;
  descripcionImagenes: TicketImage[];
  descripcionBloques: TicketContentBlock[];
  adjuntos: TicketAttachment[];
  categoria: TicketCategoryMetadata;
  slas: TicketSlaMetadata[];
  ultimoComentario: string;
  comentarios: TicketComment[];
};

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h[1-6]|blockquote)>/gi, "\n\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<img\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeTextBlock(value: string | null | undefined) {
  return stripHtml(value);
}

function isFalseLike(value: boolean | number | string | null | undefined) {
  if (value === false || value === 0) return true;
  if (typeof value === "string") return ["false", "0", "no"].includes(value.trim().toLowerCase());
  return false;
}

function isTrueLike(value: boolean | number | string | null | undefined) {
  if (value === true || value === 1) return true;
  if (typeof value === "string") return ["true", "1", "si", "sí", "yes"].includes(value.trim().toLowerCase());
  return false;
}

function isInternalComment(comment: FlexxusComment) {
  if (isTrueLike(comment.interno)) return true;
  return isFalseLike(comment.es_visible ?? comment.esVisible ?? comment.visible);
}

function extractBase64Images(value: string | null | undefined, ownerId: number): TicketImage[] {
  const html = value ?? "";
  const images: TicketImage[] = [];
  const imagePattern = /<img\b[^>]*\bsrc\s*=\s*["']?(data:(image\/(?:png|jpe?g|gif|webp));base64,([A-Za-z0-9+/=\s]+))["']?[^>]*>/gi;
  for (const match of html.matchAll(imagePattern)) {
    const dataUrl = match[1].replace(/\s+/g, "");
    const mimeType = match[2].toLowerCase();
    const base64 = match[3].replace(/\s+/g, "");
    images.push({
      id: `${ownerId}-${images.length + 1}`,
      mimeType,
      dataUrl,
      sizeBytes: Math.ceil((base64.length * 3) / 4),
    });
  }
  return images;
}

function buildContentBlocks(value: string | null | undefined, ownerId: number): TicketContentBlock[] {
  const html = value ?? "";
  const blocks: TicketContentBlock[] = [];
  const imagePattern = /<img\b[^>]*\bsrc\s*=\s*["']?(data:(image\/(?:png|jpe?g|gif|webp));base64,([A-Za-z0-9+/=\s]+))["']?[^>]*>/gi;
  let lastIndex = 0;
  let imageIndex = 0;

  for (const match of html.matchAll(imagePattern)) {
    const index = match.index ?? 0;
    const text = normalizeTextBlock(html.slice(lastIndex, index));
    if (text) blocks.push({ type: "text", id: `${ownerId}-text-${blocks.length + 1}`, text });

    const dataUrl = match[1].replace(/\s+/g, "");
    const mimeType = match[2].toLowerCase();
    const base64 = match[3].replace(/\s+/g, "");
    imageIndex += 1;
    blocks.push({
      type: "image",
      id: `${ownerId}-image-${imageIndex}`,
      image: {
        id: `${ownerId}-${imageIndex}`,
        mimeType,
        dataUrl,
        sizeBytes: Math.ceil((base64.length * 3) / 4),
      },
    });
    lastIndex = index + match[0].length;
  }

  const tailText = normalizeTextBlock(html.slice(lastIndex));
  if (tailText) blocks.push({ type: "text", id: `${ownerId}-text-${blocks.length + 1}`, text: tailText });
  if (!blocks.length && normalizeTextBlock(html)) blocks.push({ type: "text", id: `${ownerId}-text-1`, text: normalizeTextBlock(html) });
  return blocks;
}

function shortText(value: string | null | undefined, limit = 220) {
  const cleaned = (value ?? "").replace(/\s+/g, " ").trim();
  return cleaned.length <= limit ? cleaned : `${cleaned.slice(0, limit - 1).trimEnd()}...`;
}

function toNumberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function fullName(input?: { nombre?: string; apellido?: string }) {
  return [input?.nombre, input?.apellido].filter(Boolean).join(" ").trim() || "Sin dato";
}

function normalizeStatusId(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function normalizeStatusName(value: FlexxusTicketListItem) {
  if (typeof value.estado === "string") return value.estado || null;
  return value.estado?.nombre ?? value.ticketEstado?.nombre ?? value.ticketsEstados?.nombre ?? null;
}

async function requestJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Flexxus respondio ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function requestJsonOptional<T>(url: string, token: string): Promise<T | null> {
  try {
    return await requestJson<T>(url, token);
  } catch {
    return null;
  }
}

function getDetailCategoryId(detail: FlexxusTicketDetail | undefined) {
  const raw = detail?.id_categoria
    ?? (typeof detail?.categoria === "object" ? detail.categoria?.value ?? detail.categoria?.id : null)
    ?? detail?.Categorium?.value
    ?? detail?.Categorium?.id;
  return normalizeStatusId(raw);
}

function getDetailCategoryName(detail: FlexxusTicketDetail | undefined) {
  if (typeof detail?.categoria === "string") return detail.categoria || null;
  return detail?.categoria?.title ?? detail?.categoria?.nombre ?? detail?.Categorium?.title ?? detail?.Categorium?.nombre ?? null;
}

function findCategoryPath(nodes: FlexxusCategoryNode[] | undefined, categoryId: string | null, trail: string[] = []): string[] | null {
  if (!nodes?.length || !categoryId) return null;
  for (const node of nodes) {
    const nextTrail = [...trail, node.title];
    if (String(node.value) === categoryId) return nextTrail;
    const childPath = findCategoryPath(node.children, categoryId, nextTrail);
    if (childPath) return childPath;
  }
  return null;
}

function normalizeSlaType(value: number | null | undefined): "respuesta" | "resolucion" | "otro" {
  if (value === 0) return "respuesta";
  if (value === 1) return "resolucion";
  return "otro";
}

function asArray<T>(value: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function normalizeTicketSlas(payload: FlexxusTicketSla[] | { data?: FlexxusTicketSla[] } | null | undefined) {
  return asArray(payload).map((item) => ({
    id: item.id,
    titulo: item.Sla?.titulo ?? `SLA ${item.id_sla}`,
    tipo: normalizeSlaType(item.Sla?.sla_tipo),
    vencimiento: item.vencimiento_2 ?? item.vencimiento_1,
    cumplido: item.cumplido === true || item.cumplido === 1,
    porcentajeCumplido: item.porcentaje_cumplido,
    horas: item.Sla?.hora ?? null,
  }));
}

const IMAGE_ATTACHMENT_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);

function getAttachmentExtension(ruta: string) {
  const cleanPath = ruta.split("?")[0] ?? ruta;
  const match = /\.([a-z0-9]+)$/i.exec(cleanPath);
  return match?.[1]?.toLowerCase() ?? null;
}

function normalizeTicketAttachments(payload: { data?: FlexxusTicketAttachment[] } | FlexxusTicketAttachment[] | null | undefined): TicketAttachment[] {
  return asArray(payload)
    .map((item) => {
      const ruta = (item.ruta ?? "").trim();
      if (!ruta) return null;
      const extension = getAttachmentExtension(ruta);
      return {
        id: toNumberOrNull(item.id),
        nombre: ruta,
        ruta,
        extension,
        tipo: extension && IMAGE_ATTACHMENT_EXTENSIONS.has(extension) ? "image" as const : "file" as const,
        ticketId: toNumberOrNull(item.id_ticket),
        responseId: toNumberOrNull(item.id_respuesta),
        url: `${BASE_URL}/adjuntos/${encodeURIComponent(ruta)}`,
      };
    })
    .filter((item): item is TicketAttachment => Boolean(item));
}

function normalizeTicketCategory(detail: FlexxusTicketDetail | undefined, categoriesPayload?: FlexxusCategoryNode[] | { data?: FlexxusCategoryNode[] } | null): TicketCategoryMetadata {
  const categoryId = getDetailCategoryId(detail);
  const categoryPath = findCategoryPath(asArray(categoriesPayload), categoryId);
  const categoryName = getDetailCategoryName(detail);
  return {
    id: categoryId,
    nombre: categoryName ?? categoryPath?.[categoryPath.length - 1] ?? null,
    ruta: categoryPath?.join(" / ") ?? categoryName,
  };
}

function normalizeTicket(item: FlexxusTicketListItem): TicketListItem {
  return {
    id: item.id,
    titulo: item.titulo,
    asignado: fullName(item.usuarioAsignado),
    cliente: fullName(item.cliente),
    clienteId: toNumberOrNull(item.id_cliente_asignado ?? item.cliente?.id),
    empresa: item.empresa?.nombre ?? "Sin empresa",
    empresaId: toNumberOrNull(item.id_empresa ?? item.empresa?.id),
    servicioId: toNumberOrNull(item.id_servicio ?? (typeof item.servicio === "object" ? item.servicio?.id : item.servicio)),
    tipoSolicitudId: toNumberOrNull(item.id_tipo_solicitud),
    prioridadId: toNumberOrNull(item.id_prioridad),
    equipoId: toNumberOrNull(item.id_equipo),
    usuarioAsignadoId: toNumberOrNull(item.id_usuario_asignado),
    estadoId: normalizeStatusId(item.id_estado ?? item.estado_id ?? (typeof item.estado === "object" ? item.estado?.id : null) ?? item.ticketEstado?.id ?? item.ticketsEstados?.id),
    estadoNombre: normalizeStatusName(item),
    fechaModificacion: item.fecha_modificacion,
  };
}

export async function buildTicketDetailById(input: { token: string; ticketId: number }): Promise<TicketDetail> {
  const detailPayload = await requestJson<{ data: FlexxusTicketDetail & FlexxusTicketListItem }>(`${BASE_URL}/tickets/${input.ticketId}`, input.token);
  const ticket = normalizeTicket(detailPayload.data);
  return buildTicketDetail({ token: input.token, ticket });
}

export async function buildTicketDetail(input: { token: string; ticket: TicketListItem }): Promise<TicketDetail> {
  const [detailPayload, commentsPayload, slaPayload, categoriesPayload, attachmentsPayload] = await Promise.all([
    requestJson<{ data: FlexxusTicketDetail }>(`${BASE_URL}/tickets/${input.ticket.id}`, input.token),
    requestJson<{ data: FlexxusComment[] }>(`${BASE_URL}/ticket-respuestas/${input.ticket.id}`, input.token),
    requestJsonOptional<FlexxusTicketSla[] | { data?: FlexxusTicketSla[] }>(`${BASE_URL}/tickets-sla/${input.ticket.id}`, input.token),
    requestJsonOptional<FlexxusCategoryNode[] | { data?: FlexxusCategoryNode[] }>(`${BASE_URL}/arbolcategorias`, input.token),
    requestJsonOptional<{ data?: FlexxusTicketAttachment[] }>(`${BASE_URL}/tickets-adjuntos/${input.ticket.id}`, input.token),
  ]);
  return buildTicketDetailFromFlexxusPayload({
    ticket: input.ticket,
    detail: detailPayload.data,
    comments: commentsPayload.data ?? [],
    slaPayload,
    categoriesPayload,
    attachmentsPayload,
  });
}

export function buildTicketDetailFromFlexxusPayload(input: {
  ticket: TicketListItem;
  detail?: FlexxusTicketDetail;
  comments?: FlexxusComment[];
  slaPayload?: FlexxusTicketSla[] | { data?: FlexxusTicketSla[] } | null;
  categoriesPayload?: FlexxusCategoryNode[] | { data?: FlexxusCategoryNode[] } | null;
  attachmentsPayload?: { data?: FlexxusTicketAttachment[] } | FlexxusTicketAttachment[] | null;
}): TicketDetail {
  const detailDescription = input.detail?.descripcion;
  const fresh = normalizeTicketCategory(input.detail, input.categoriesPayload);
  const previous = input.ticket.categoria;
  const categoria: TicketCategoryMetadata = {
    id: fresh.id ?? previous?.id ?? null,
    nombre: fresh.nombre ?? previous?.nombre ?? null,
    ruta: fresh.ruta ?? previous?.ruta ?? fresh.nombre ?? previous?.nombre ?? null,
  };
  const comentarios = [...(input.comments ?? [])].reverse().map((comment) => ({
    id: comment.id,
    autor: fullName(comment.usuarioRespuesta),
    tipoAutor: comment.usuarioRespuesta?.usuariosTipos?.nombre === "Agente" ? "agente" as const : "cliente" as const,
    fecha: comment.fecha_creacion,
    contenido: stripHtml(comment.respuesta),
    imagenes: extractBase64Images(comment.respuesta, comment.id),
    esSolucion: Boolean(comment.es_solucion),
    esInterno: isInternalComment(comment),
  }));
  const lastComment = comentarios[comentarios.length - 1];
  return {
    ...input.ticket,
    clienteId: input.ticket.clienteId ?? toNumberOrNull(input.detail?.id_cliente_asignado),
    servicioId: input.ticket.servicioId ?? toNumberOrNull(input.detail?.id_servicio ?? (typeof input.detail?.servicio === "object" ? input.detail?.servicio?.id : input.detail?.servicio)),
    tipoSolicitudId: input.ticket.tipoSolicitudId ?? toNumberOrNull(input.detail?.id_tipo_solicitud),
    prioridadId: input.ticket.prioridadId ?? toNumberOrNull(input.detail?.id_prioridad),
    equipoId: input.ticket.equipoId ?? toNumberOrNull(input.detail?.id_equipo),
    usuarioAsignadoId: input.ticket.usuarioAsignadoId ?? toNumberOrNull(input.detail?.id_usuario_asignado),
    descripcion: stripHtml(detailDescription),
    descripcionImagenes: extractBase64Images(detailDescription, input.ticket.id),
    descripcionBloques: buildContentBlocks(detailDescription, input.ticket.id),
    adjuntos: normalizeTicketAttachments(input.attachmentsPayload),
    categoria,
    slas: normalizeTicketSlas(input.slaPayload),
    ultimoComentario: shortText(lastComment?.contenido),
    comentarios,
  };
}
