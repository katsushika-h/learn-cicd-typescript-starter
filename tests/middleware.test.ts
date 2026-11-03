import { beforeEach, describe, expect, it, vi } from "vitest";
import { middlewareAuth } from "../src/api/middleware.js";
import { getUser } from "../src/db/queries/users.js";
import type { User } from "../src/db/schema.js";
import {
  makeMockRequest,
  makeMockResponse,
  makeMockUser,
  sentJSON,
} from "./helpers.js";

vi.mock("../src/db/queries/users.js", () => ({
  getUser: vi.fn(),
}));

describe("middlewareAuth", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("responds 401 when the authorization header is missing", async () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    const handler = vi.fn();

    await middlewareAuth(handler)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(sentJSON(res)).toEqual({ error: "Couldn't find api key" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("responds 401 for a malformed authorization header", async () => {
    const req = makeMockRequest({
      headers: { authorization: "Bearer some-key" },
    });
    const res = makeMockResponse();
    const handler = vi.fn();

    await middlewareAuth(handler)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("responds 404 when no user matches the api key", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const req = makeMockRequest({
      headers: { authorization: "ApiKey unknown" },
    });
    const res = makeMockResponse();
    const handler = vi.fn();

    await middlewareAuth(handler)(req, res);

    expect(getUser).toHaveBeenCalledWith("unknown");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(sentJSON(res)).toEqual({ error: "Couldn't get user" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls the handler with the authenticated user", async () => {
    const user = makeMockUser();
    vi.mocked(getUser).mockResolvedValue(user as User);
    const req = makeMockRequest({
      headers: { authorization: "ApiKey api-key-1" },
    });
    const res = makeMockResponse();
    const handler = vi.fn();

    await middlewareAuth(handler)(req, res);

    expect(getUser).toHaveBeenCalledWith("api-key-1");
    expect(handler).toHaveBeenCalledWith(req, res, user);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds 500 when the lookup throws", async () => {
    vi.mocked(getUser).mockRejectedValue(new Error("db down"));
    const req = makeMockRequest({
      headers: { authorization: "ApiKey api-key-1" },
    });
    const res = makeMockResponse();
    const handler = vi.fn();

    await middlewareAuth(handler)(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sentJSON(res)).toEqual({ error: "Couldn't authenticate user" });
    expect(handler).not.toHaveBeenCalled();
  });
});
