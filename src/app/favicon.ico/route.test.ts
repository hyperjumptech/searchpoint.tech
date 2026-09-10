import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /favicon.ico", () => {
  it("returns hyperjump favicon by default", async () => {
    const req = new NextRequest("http://localhost:3000/favicon.ico");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/x-icon");
  });

  it("returns smdv favicon for smdv host or param", async () => {
    const req = new NextRequest(
      "http://localhost:3000/favicon.ico?company=smdv",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/x-icon");
  });

  it("returns sinarmas favicon for sinarmas host or param", async () => {
    const req = new NextRequest(
      "http://localhost:3000/favicon.ico?company=sinarmas",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/x-icon");
  });
});
