type RequestLogEntry = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string;
  userId?: string;
  timestamp: string;
};

type ApiErrorEntry = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  stack?: string;
  userId?: string;
  timestamp: string;
};

const MAX_REQUEST_LOGS = 200;
const MAX_ERROR_LOGS = 100;

const requestLogs: RequestLogEntry[] = [];
const apiErrors: ApiErrorEntry[] = [];

function appendWithLimit<T>(collection: T[], item: T, limit: number) {
  collection.unshift(item);
  if (collection.length > limit) {
    collection.length = limit;
  }
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function recordRequestLog(entry: Omit<RequestLogEntry, 'id' | 'timestamp'>) {
  appendWithLimit(
    requestLogs,
    {
      ...entry,
      id: createId('req'),
      timestamp: new Date().toISOString(),
    },
    MAX_REQUEST_LOGS
  );
}

export function recordApiError(entry: Omit<ApiErrorEntry, 'id' | 'timestamp'>) {
  appendWithLimit(
    apiErrors,
    {
      ...entry,
      id: createId('err'),
      timestamp: new Date().toISOString(),
    },
    MAX_ERROR_LOGS
  );
}

export function getRequestLogs() {
  return requestLogs;
}

export function getApiErrors() {
  return apiErrors;
}
