export function buildOrderSaleQuery(input: { orderId: string; serviceId?: string }) {
  const safeOrderId = input.orderId.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const lines = [
    "fields @timestamp, message, serviceId, correlationId, @message",
    `| filter details.orderId = "${safeOrderId}"`,
  ];
  if (input.serviceId?.trim()) {
    const safeServiceId = input.serviceId.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`| filter serviceId = "${safeServiceId}"`);
  }
  lines.push("| sort @timestamp asc", "| limit 10000");
  return lines.join("\n");
}
