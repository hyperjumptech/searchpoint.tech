// src/lib/mcp-tools.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";

import { callTool, toolsList } from "@/lib/mcp-tools";

const realFetch = globalThis.fetch;

function stubFetch(status: number, body: unknown) {
  const fn = vi.fn(
    async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.unstubAllGlobals();
});

const SCSE = "scse-1";

describe("toolsList", () => {
  it("exposes exactly search_file and get_file with JSON Schemas", () => {
    const tools = toolsList();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "get_file",
      "search_file",
    ]);
    for (const t of tools) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.inputSchema).toHaveProperty("type", "object");
    }
  });
});

describe("search_file", () => {
  it("composes no filter and defaults without optional args", async () => {
    const fetchMock = stubFetch(200, { status: "ok", value: [] });
    const res = await callTool("search_file", { search: "pajak" }, SCSE);
    expect(res.status).toBe("ok");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      { headers: Record<string, string> },
    ];
    expect(url.toString()).toContain("/v1/files?");
    expect(url.searchParams.get("search")).toBe("pajak");
    expect(url.searchParams.get("filter")).toBeNull();
    expect(url.searchParams.get("sort")).toBe("relevance");
    expect(url.searchParams.get("mode")).toBe("broad");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("offset")).toBe("0");
    expect(init.headers.Cookie).toBe(`SCSE_ID=${SCSE}`);
  });

  it("composes all filter parts joined with ' and ' in fixed order", async () => {
    const fetchMock = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "pajak",
        extension: ["PDF", "docx"],
        source: "shared folder",
        mode: "exact",
        limit: 25,
        page: 3,
      },
      SCSE,
    );
    const [url] = fetchMock.mock.calls[0] as unknown as [URL];
    expect(url.searchParams.get("filter")).toBe(
      "extension in ('pdf','docx') and source eq 'shared folder'",
    );
    expect(url.searchParams.get("sort")).toBe("relevance");
    expect(url.searchParams.get("mode")).toBe("exact");
    expect(url.searchParams.get("limit")).toBe("25");
    expect(url.searchParams.get("offset")).toBe("50");
  });

  it("rejects hostile extension and bad pagination with invalidParams", async () => {
    for (const args of [
      { extension: ["pdf') or ('"] },
      { extension: ["*invalid!"] },
      { limit: 51 },
      { limit: 0 },
      { page: 0 },
      { page: -1 },
    ]) {
      const res = await callTool("search_file", args, SCSE);
      expect(res.status).toBe("invalidParams");
    }
  });

  it("strips sentinels: unknown source and wildcard extension are ignored", async () => {
    const fetchMock = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "q3",
        extension: ["*"],
        source: "unknown",
      },
      SCSE,
    );
    const [url] = fetchMock.mock.calls[0] as unknown as [URL];
    expect(url.searchParams.get("filter")).toBeNull();
    expect(url.searchParams.get("search")).toBe("q3");
  });

  it("maps backend 401/400/5xx and network failure to isError", async () => {
    stubFetch(401, {});
    expect(await callTool("search_file", {}, SCSE)).toEqual({
      status: "isError",
      text: "Session expired — please re-authenticate.",
    });
    stubFetch(400, { message: "bad filter" });
    const bad = await callTool("search_file", {}, SCSE);
    expect(bad.status).toBe("isError");
    if (bad.status === "isError") expect(bad.text).toContain("bad filter");
    stubFetch(503, {});
    expect((await callTool("search_file", {}, SCSE)).status).toBe("isError");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("refused");
      }),
    );
    const net = await callTool("search_file", {}, SCSE);
    expect(net).toEqual({ status: "isError", text: "Backend unavailable." });
  });

  it("passes backend JSON through verbatim on 200", async () => {
    stubFetch(200, {
      status: "ok",
      value: [{ _source: { id: "d1", name: "a.pdf" } }],
      meta: { pagination: { limit: 10, offset: 0, total: 1 } },
    });
    const res = await callTool("search_file", {}, SCSE);
    expect(res.status).toBe("ok");
    if (res.status === "ok") {
      const parsed = JSON.parse(res.text) as { meta: unknown };
      expect(parsed.meta).toBeTruthy();
    }
  });
});

describe("get_file", () => {
  it("GETs /v1/files/{encoded id} with SCSE_ID and passes JSON through", async () => {
    const fetchMock = stubFetch(200, {
      status: "ok",
      value: { data: { id: "d 1", name: "x.pdf" } },
    });
    const res = await callTool("get_file", { id: "d 1" }, SCSE);
    expect(res.status).toBe("ok");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      { headers: Record<string, string>; method: string },
    ];
    expect(url.pathname).toBe("/v1/files/d%201");
    expect(init.method).toBe("GET");
    expect(init.headers.Cookie).toBe(`SCSE_ID=${SCSE}`);
  });

  it("maps 404 to fixed anti-enumeration message", async () => {
    stubFetch(404, {});
    const res = await callTool("get_file", { id: "nope" }, SCSE);
    expect(res).toEqual({
      status: "isError",
      text: "File not found or you do not have access.",
    });
  });

  it("rejects missing id", async () => {
    const res = await callTool("get_file", {}, SCSE);
    expect(res.status).toBe("invalidParams");
  });
});

describe("callTool dispatch", () => {
  it("returns unknownTool for unknown names", async () => {
    expect((await callTool("delete_file", {}, SCSE)).status).toBe(
      "unknownTool",
    );
  });
});
