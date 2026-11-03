import { afterEach, describe, expect, it, vi } from "vitest";
import { respondWithError, respondWithJSON } from "../src/api/json.js";
import { makeMockResponse, sentJSON } from "./helpers.js";

describe("respondWithJSON", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets the JSON content type and status, then sends the body", () => {
    const res = makeMockResponse();

    respondWithJSON(res, 201, { id: "1", name: "alice" });

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith('{"id":"1","name":"alice"}');
    expect(res.end).toHaveBeenCalledOnce();
    expect(sentJSON(res)).toEqual({ id: "1", name: "alice" });
  });

  it("accepts string payloads", () => {
    const res = makeMockResponse();

    respondWithJSON(res, 200, "ok");

    expect(res.send).toHaveBeenCalledWith('"ok"');
    expect(res.end).toHaveBeenCalledOnce();
  });

  it("throws when the payload is not an object or string", () => {
    const res = makeMockResponse();

    expect(() => respondWithJSON(res, 200, 42)).toThrow(
      "Payload must be an object or a string",
    );
    expect(res.send).not.toHaveBeenCalled();
  });
});

describe("respondWithError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends an error object with the given status", () => {
    const res = makeMockResponse();

    respondWithError(res, 404, "Not found");

    expect(res.status).toHaveBeenCalledWith(404);
    expect(sentJSON(res)).toEqual({ error: "Not found" });
  });

  it("does not log when no error is provided", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = makeMockResponse();

    respondWithError(res, 400, "Bad request");

    expect(log).not.toHaveBeenCalled();
  });

  it("logs the message of an Error", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = makeMockResponse();

    respondWithError(res, 500, "Oops", new Error("boom"));

    expect(log).toHaveBeenCalledWith("boom");
  });

  it("logs string errors directly", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = makeMockResponse();

    respondWithError(res, 500, "Oops", "boom");

    expect(log).toHaveBeenCalledWith("boom");
  });

  it("stringifies non-Error values", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = makeMockResponse();

    respondWithError(res, 500, "Oops", { reason: "boom" });

    expect(log).toHaveBeenCalledWith("[object Object]");
  });
});
