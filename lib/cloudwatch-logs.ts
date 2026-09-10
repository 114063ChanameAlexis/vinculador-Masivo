import {
  CloudWatchLogsClient,
  GetQueryResultsCommand,
  StartQueryCommand,
} from "@aws-sdk/client-cloudwatch-logs";

const MAX_LIMIT = 10000;

export type CloudWatchInsightsRow = Record<string, string>;

function getCloudWatchClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const region = process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Falta configurar AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY en Vercel.");
  }
  if (!region) {
    throw new Error("Falta configurar AWS_REGION en Vercel.");
  }
  return new CloudWatchLogsClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function clampLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) return 50;
  return Math.max(1, Math.min(Math.floor(limit), MAX_LIMIT));
}

function normalizeInsightsRows(results: Array<Array<{ field?: string; value?: string }>> | undefined): CloudWatchInsightsRow[] {
  return (results ?? []).map((row) => Object.fromEntries(
    row
      .filter((cell) => cell.field && !cell.field.startsWith("@ptr"))
      .map((cell) => [cell.field as string, cell.value ?? ""]),
  ));
}

export async function runCloudWatchInsightsQuery(input: {
  logGroupNames: string[];
  queryString: string;
  startTime: number;
  endTime: number;
  limit?: number;
}) {
  const client = getCloudWatchClient();
  const start = await client.send(new StartQueryCommand({
    logGroupNames: input.logGroupNames,
    queryString: input.queryString,
    startTime: Math.floor(input.startTime / 1000),
    endTime: Math.floor(input.endTime / 1000),
    limit: clampLimit(input.limit),
  }));
  if (!start.queryId) throw new Error("CloudWatch no devolvio queryId.");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await client.send(new GetQueryResultsCommand({ queryId: start.queryId }));
    if (result.status === "Complete") {
      return {
        queryId: start.queryId,
        status: result.status,
        rows: normalizeInsightsRows(result.results),
        statistics: result.statistics,
      };
    }
    if (result.status === "Failed" || result.status === "Cancelled" || result.status === "Timeout") {
      throw new Error(`CloudWatch Insights finalizo con estado ${result.status}.`);
    }
  }

  throw new Error("CloudWatch Insights no finalizo dentro del tiempo esperado.");
}
