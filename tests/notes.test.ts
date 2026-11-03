import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handlerNotesCreate,
  handlerNotesGet,
} from "../src/api/notes.js";
import {
  createNote,
  getNote,
  getNotesForUser,
} from "../src/db/queries/notes.js";
import type { Note, User } from "../src/db/schema.js";
import {
  makeMockNote,
  makeMockRequest,
  makeMockResponse,
  makeMockUser,
  sentJSON,
} from "./helpers.js";

vi.mock("../src/db/queries/notes.js", () => ({
  createNote: vi.fn(),
  getNote: vi.fn(),
  getNotesForUser: vi.fn(),
}));

describe("handlerNotesGet", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("responds 200 with the notes belonging to the user", async () => {
    const user = makeMockUser() as User;
    const notes = [makeMockNote(), makeMockNote({ id: "note-2" })];
    vi.mocked(getNotesForUser).mockResolvedValue(notes as Note[]);
    const res = makeMockResponse();

    await handlerNotesGet(makeMockRequest(), res, user);

    expect(getNotesForUser).toHaveBeenCalledWith(user.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(sentJSON(res)).toEqual(notes);
  });

  it("responds 500 when fetching notes throws", async () => {
    vi.mocked(getNotesForUser).mockRejectedValue(new Error("db down"));
    const res = makeMockResponse();

    await handlerNotesGet(makeMockRequest(), res, makeMockUser() as User);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sentJSON(res)).toEqual({ error: "Couldn't retrieve notes" });
  });
});

describe("handlerNotesCreate", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("creates a note for the user and responds 201", async () => {
    const user = makeMockUser() as User;
    const note = makeMockNote({ note: "buy milk" });
    vi.mocked(createNote).mockResolvedValue(note as Note);
    vi.mocked(getNote).mockResolvedValue(note as Note);
    const req = makeMockRequest({ body: { note: "buy milk" } });
    const res = makeMockResponse();

    await handlerNotesCreate(req, res, user);

    expect(createNote).toHaveBeenCalledOnce();
    const created = vi.mocked(createNote).mock.calls[0][0];
    expect(created.note).toBe("buy milk");
    expect(created.userId).toBe(user.id);
    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toEqual(expect.any(String));
    expect(created.updatedAt).toEqual(expect.any(String));

    expect(getNote).toHaveBeenCalledWith(created.id);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(sentJSON(res)).toEqual(note);
  });

  it("responds 500 when creating the note throws", async () => {
    vi.mocked(createNote).mockRejectedValue(new Error("db down"));
    const req = makeMockRequest({ body: { note: "buy milk" } });
    const res = makeMockResponse();

    await handlerNotesCreate(req, res, makeMockUser() as User);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sentJSON(res)).toEqual({ error: "Couldn't create note" });
    expect(getNote).not.toHaveBeenCalled();
  });
});
