import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handlerUsersCreate,
  handlerUsersGet,
} from "../src/api/users.js";
import { createUser, getUser } from "../src/db/queries/users.js";
import type { User } from "../src/db/schema.js";
import {
  makeMockRequest,
  makeMockResponse,
  makeMockUser,
  sentJSON,
} from "./helpers.js";

vi.mock("../src/db/queries/users.js", () => ({
  createUser: vi.fn(),
  getUser: vi.fn(),
}));

describe("handlerUsersCreate", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("creates a user and responds 201 with the stored user", async () => {
    const user = makeMockUser({ name: "alice" });
    vi.mocked(createUser).mockResolvedValue(user as User);
    vi.mocked(getUser).mockResolvedValue(user as User);
    const req = makeMockRequest({ body: { name: "alice" } });
    const res = makeMockResponse();

    await handlerUsersCreate(req, res);

    expect(createUser).toHaveBeenCalledOnce();
    const created = vi.mocked(createUser).mock.calls[0][0];
    expect(created.name).toBe("alice");
    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(created.apiKey).toMatch(/^[0-9a-f]{64}$/);
    expect(created.createdAt).toEqual(expect.any(String));
    expect(created.updatedAt).toEqual(expect.any(String));

    expect(getUser).toHaveBeenCalledWith(created.apiKey);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(sentJSON(res)).toEqual(user);
  });

  it("responds 500 when the user can't be read back after creation", async () => {
    vi.mocked(createUser).mockResolvedValue(makeMockUser() as User);
    vi.mocked(getUser).mockResolvedValue(null);
    const req = makeMockRequest({ body: { name: "alice" } });
    const res = makeMockResponse();

    await handlerUsersCreate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sentJSON(res)).toEqual({ error: "Couldn't retrieve user" });
  });

  it("responds 500 when creating the user throws", async () => {
    vi.mocked(createUser).mockRejectedValue(new Error("db down"));
    const req = makeMockRequest({ body: { name: "alice" } });
    const res = makeMockResponse();

    await handlerUsersCreate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sentJSON(res)).toEqual({ error: "Couldn't create user" });
    expect(getUser).not.toHaveBeenCalled();
  });
});

describe("handlerUsersGet", () => {
  it("responds 200 with the authenticated user", () => {
    const user = makeMockUser() as User;
    const res = makeMockResponse();

    handlerUsersGet(makeMockRequest(), res, user);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(sentJSON(res)).toEqual(user);
  });
});
