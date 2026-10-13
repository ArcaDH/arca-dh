import { Request, Response } from "express";
import { vi } from "vitest";
import jwt from "jsonwebtoken";
import { generateToken } from "../../src/services/tokenService";

export const TEST_TOKEN_SECRET = "test-jwt-secret-key-1234567890";
process.env.TOKEN_SECRET = TEST_TOKEN_SECRET;

export function generateTokenWithoutUserId(email: string = "test@example.com"): string {
  return jwt.sign({ email, created_at: Date.now() }, TEST_TOKEN_SECRET);
}

export interface MockResponse extends Partial<Response> {
  statusCode: number;
  body: any;
  status: any;
  json: any;
  send: any;
  sendStatus: any;
}

export function createMockRequest(
  options: {
    params?: Record<string, string>;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
    tokenUserId?: number;
    tokenEmail?: string;
  } = {},
): Request {
  const headers = { ...(options.headers || {}) };

  if (options.tokenUserId !== undefined) {
    const email = options.tokenEmail ?? `user${options.tokenUserId}@example.com`;
    const token = generateToken(email, options.tokenUserId);
    headers.authorization = `Bearer ${token}`;
  }

  const req: any = {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: headers,
    get: (name: string) => {
      const lower = name.toLowerCase();
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) return value;
      }
      return undefined;
    },
  };

  return req as Request;
}

export function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: undefined,
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
    sendStatus: vi.fn(),
  };

  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json.mockImplementation((data: any) => {
    res.body = data;
    return res;
  });

  res.send.mockImplementation((data?: any) => {
    res.body = data;
    return res;
  });

  res.sendStatus.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });

  return res;
}
