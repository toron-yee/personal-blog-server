import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface AuthenticatedRequest extends Request {
  requestId?: string;
  user?: {
    id?: string;
    [key: string]: unknown;
  };
}

export interface RequestContextMetadata {
  requestId: string;
  userId?: string;
}

export function ensureRequestId(
  request: AuthenticatedRequest,
  response?: Response,
) {
  const requestId =
    request.requestId || normalizeRequestId(request.headers[REQUEST_ID_HEADER]) || randomUUID();

  request.requestId = requestId;
  response?.setHeader(REQUEST_ID_HEADER, requestId);

  return requestId;
}

export function buildRequestLogMetadata(
  request: AuthenticatedRequest,
  requestId = ensureRequestId(request),
) {
  return {
    requestId,
    method: request.method,
    path: request.originalUrl || request.url,
    userId: request.user?.id || 'anonymous',
    ip: request.ip || request.socket?.remoteAddress || 'unknown',
  };
}

export function buildRequestContextMetadata(
  request: AuthenticatedRequest,
  requestId = ensureRequestId(request),
): RequestContextMetadata {
  return {
    requestId,
    userId: request.user?.id,
  };
}

function normalizeRequestId(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalized = rawValue?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 128);
}
