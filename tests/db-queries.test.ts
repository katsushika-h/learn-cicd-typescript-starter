import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, assertDbConnection } from "../src/db/index.js";
import { createUser, getUser } from "../src/db/queries/users.js";
import {
  createNote,
  getNote,
  getNotesForUser,
} from "../src/db/queries/notes.js";
import { notesTable, usersTable } from "../src/db/schema.js";
import type { NewNote, NewUser } from "../src/db/schema.js";
import { makeMockNote, makeMockUser } from "./helpers.js";

vi.mock("../src/db/index.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
  assertDbConnection: vi.fn(),
}));

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
};

function mockInsertReturning(rows: unknown[]) {
  const returning = vi.fn().mockResolvedValue(rows);
  const values = vi.fn().mockReturnValue({ returning });
  mockDb.insert.mockReturnValue({ values });
  return { values, returning };
}

function mockSelectWhere(rows: unknown[]) {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ where });
  mockDb.select.mockReturnValue({ from });
  return { from, where };
}

const newUser: NewUser = {
  id: "user-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  name: "alice",
  apiKey: "api-key-1",
};

const newNote: NewNote = {
  id: "note-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  note: "hello",
  userId: "user-1",
};

describe("user queries", () => {
  beforeEach(() => {
    vi.mocked(assertDbConnection).mockClear();
  });

  it("createUser inserts into the users table and returns the new row", async () => {
    const { values } = mockInsertReturning([makeMockUser()]);

    const result = await createUser(newUser);

    expect(assertDbConnection).toHaveBeenCalledOnce();
    expect(mockDb.insert).toHaveBeenCalledWith(usersTable);
    expect(values).toHaveBeenCalledWith(newUser);
    expect(result).toEqual(makeMockUser());
  });

  it("createUser throws when nothing is returned", async () => {
    mockInsertReturning([]);

    await expect(createUser(newUser)).rejects.toThrow("Failed to create user");
  });

  it("getUser returns the first matching row", async () => {
    const { from, where } = mockSelectWhere([makeMockUser()]);

    const result = await getUser("api-key-1");

    expect(assertDbConnection).toHaveBeenCalledOnce();
    expect(mockDb.select).toHaveBeenCalledOnce();
    expect(from).toHaveBeenCalledWith(usersTable);
    expect(where).toHaveBeenCalledOnce();
    expect(result).toEqual(makeMockUser());
  });

  it("getUser returns null when there is no match", async () => {
    mockSelectWhere([]);

    await expect(getUser("missing")).resolves.toBeNull();
  });
});

describe("note queries", () => {
  beforeEach(() => {
    vi.mocked(assertDbConnection).mockClear();
  });

  it("createNote inserts into the notes table and returns the new row", async () => {
    const { values } = mockInsertReturning([makeMockNote()]);

    const result = await createNote(newNote);

    expect(assertDbConnection).toHaveBeenCalledOnce();
    expect(mockDb.insert).toHaveBeenCalledWith(notesTable);
    expect(values).toHaveBeenCalledWith(newNote);
    expect(result).toEqual(makeMockNote());
  });

  it("createNote throws when nothing is returned", async () => {
    mockInsertReturning([]);

    await expect(createNote(newNote)).rejects.toThrow("Failed to create note");
  });

  it("getNote returns the first matching row", async () => {
    const { from } = mockSelectWhere([makeMockNote()]);

    const result = await getNote("note-1");

    expect(from).toHaveBeenCalledWith(notesTable);
    expect(result).toEqual(makeMockNote());
  });

  it("getNote returns null when there is no match", async () => {
    mockSelectWhere([]);

    await expect(getNote("missing")).resolves.toBeNull();
  });

  it("getNotesForUser returns all rows for the user", async () => {
    const notes = [makeMockNote(), makeMockNote({ id: "note-2" })];
    mockSelectWhere(notes);

    const result = await getNotesForUser("user-1");

    expect(assertDbConnection).toHaveBeenCalledOnce();
    expect(result).toEqual(notes);
  });
});
