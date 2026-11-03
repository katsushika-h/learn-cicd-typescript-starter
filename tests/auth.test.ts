import { describe, expect, it } from "vitest";
import { getAPIKey } from "../src/api/auth.js";

describe("getAPIKey", () => {
  it("returns null when there is no authorization header", () => {
    expect(getAPIKey({})).toBeNull();
  });

  it("returns the key for a well-formed ApiKey header", () => {
    expect(getAPIKey({ authorization: "ApiKey abc123" })).toBe("abc123");
  });

  it("returns null when the scheme is not ApiKey", () => {
    expect(getAPIKey({ authorization: "Bearer abc123" })).toBeNull();
    expect(getAPIKey({ authorization: "apikey abc123" })).toBeNull();
  });

  it("returns null when the header has no key", () => {
    expect(getAPIKey({ authorization: "ApiKey" })).toBeNull();
    expect(getAPIKey({ authorization: "" })).toBeNull();
  });

  it("returns only the first value after the scheme", () => {
    expect(getAPIKey({ authorization: "ApiKey abc123 extra" })).toBe("abc123");
  });
});
