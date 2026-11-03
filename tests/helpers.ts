import { vi } from "vitest";
import type { Request, Response } from "express";

/**
 * Minimal Express Response double that records what handlers do.
 * `status` and `send` return the response so chaining works.
 */
export function makeMockResponse() {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn(),
    send: vi.fn(),
    end: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.send.mockReturnValue(res);

  return res;
}

export type MockResponse = ReturnType<typeof makeMockResponse>;

/** Parse the JSON body passed to `res.send`, if any. */
export function sentJSON(res: MockResponse): unknown {
  const call = res.send.mock.calls[0];
  return call ? JSON.parse(call[0] as string) : undefined;
}

/** Minimal Express Request double. */
export function makeMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    headers: {},
    ...overrides,
  } as Request;
}

export function makeMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    name: "alice",
    apiKey: "api-key-1",
    ...overrides,
  };
}

export function makeMockNote(overrides: Record<string, unknown> = {}) {
  return {
    id: "note-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    note: "hello",
    userId: "user-1",
    ...overrides,
  };
}
