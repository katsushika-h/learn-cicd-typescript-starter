import { describe, expect, it } from "vitest";
import { handlerReadiness } from "../src/api/readiness.js";
import { makeMockRequest, makeMockResponse, sentJSON } from "./helpers.js";

describe("handlerReadiness", () => {
  it("responds with 200 and an ok status", () => {
    const res = makeMockResponse();

    handlerReadiness(makeMockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(sentJSON(res)).toEqual({ status: "ok" });
  });
});
