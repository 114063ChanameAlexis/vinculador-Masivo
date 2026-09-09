const TICKETS_BASE_URL = "https://soporte.flexxus.com.ar/api/tickets";

const TICKET_STATUSES = {
  ASSIGNED: "2",
  IN_PROGRESS: "3",
  WAITING_CLIENT: "8",
  WAITING_INTERNAL: "9",
  REVIEW: "10",
  FOLLOW_UP: "11",
} as const;

const FIRST_RESPONSE_STATUS_IDS = [TICKET_STATUSES.ASSIGNED];
const MANAGEMENT_STATUS_IDS = [
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.WAITING_CLIENT,
  TICKET_STATUSES.WAITING_INTERNAL,
  TICKET_STATUSES.REVIEW,
  TICKET_STATUSES.FOLLOW_UP,
];

function buildTicketsEndpoint(agentId: string, statusIds: readonly string[]) {
  const url = new URL(TICKETS_BASE_URL);
  url.searchParams.set("id_usuario_asignado", agentId);
  for (const statusId of statusIds) {
    url.searchParams.append("id_estado[]", statusId);
  }
  url.searchParams.set("order", "fecha_modificacion");
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "10");
  return url.toString();
}

export function buildFirstResponseTicketsEndpoint(agentId: string) {
  return buildTicketsEndpoint(agentId, FIRST_RESPONSE_STATUS_IDS);
}

export function buildManagementTicketsEndpoint(agentId: string) {
  return buildTicketsEndpoint(agentId, MANAGEMENT_STATUS_IDS);
}
