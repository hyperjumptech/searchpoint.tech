// src/lib/mcp-tools.bubble.test.ts - combinatorial bubble-sort style
import { describe, it, expect, vi, afterEach } from "vitest";
import { callTool } from "@/lib/mcp-tools";

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
function getFilter(url: URL | string) {
  return new URL(url.toString()).searchParams.get("filter");
}
function getSearch(url: URL | string) {
  return new URL(url.toString()).searchParams.get("search");
}

describe("mcp-tools bubble sort combinatorial - search is required, others optional undefined", () => {
  it("search doang - no filter, only search", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    const r = await callTool("search_file", { search: "laporan" }, SCSE);
    expect(r.status).toBe("ok");
    const url = (fm.mock.calls[0] as unknown as [URL])[0];
    expect(getSearch(url)).toBe("laporan");
    expect(getFilter(url)).toBeNull();
  });

  it("search + kind", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool("search_file", { search: "laporan", kind: "video" }, SCSE);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'video'",
    );
  });

  it("search + kind + author", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "laporan", kind: "video", author: "satriyo" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'video' and created_by eq 'satriyo'",
    );
  });

  it("search + kind + author + type", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "laporan", kind: "video", author: "satriyo", type: ["pdf"] },
      SCSE,
    );
    // order is type -> kind -> created_by
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and kind eq 'video' and created_by eq 'satriyo'",
    );
  });

  it("search + kind + author + type + source", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "laporan",
        kind: "video",
        author: "satriyo",
        type: ["pdf"],
        source: "onedrive",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and kind eq 'video' and created_by eq 'satriyo' and source eq 'onedrive'",
    );
  });

  it("search + kind + author + type + source + updated_after", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "laporan",
        kind: "video",
        author: "satriyo",
        type: ["pdf"],
        source: "onedrive",
        updated_after: "2023-01-01T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and kind eq 'video' and created_by eq 'satriyo' and source eq 'onedrive' and updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("search + kind + author + type + source + updated_after + updated_before (full)", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "laporan",
        kind: "document",
        author: "satriyo@hyperjump.tech",
        type: ["pdf", "docx"],
        source: "sharepoint",
        updated_after: "2023-01-01T00:00:00Z",
        updated_before: "2023-12-31T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension in ('pdf','docx') and kind eq 'document' and created_by eq 'satriyo@hyperjump.tech' and source eq 'sharepoint' and updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  // bubble variations: search + author
  it("search + author", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool("search_file", { search: "hello", author: "satriyo" }, SCSE);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "created_by eq 'satriyo'",
    );
  });

  it("search + author + updated", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "hello",
        author: "satriyo",
        updated_after: "2023-01-01T00:00:00Z",
        updated_before: "2023-12-31T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "created_by eq 'satriyo' and updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("search + updated (gte only)", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", updated_after: "2023-01-01T00:00:00Z" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("search + updated (lte only)", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", updated_before: "2023-12-31T00:00:00Z" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("search + updated (both) via aliases", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "hello",
        updated_at_gte: "2023-01-01T00:00:00Z",
        date_lte: "2023-12-31T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("search + type (single eq)", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool("search_file", { search: "hello", type: ["pdf"] }, SCSE);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf'",
    );
  });

  it("search + type (multi in)", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", type: ["pdf", "docx"] },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension in ('pdf','docx')",
    );
  });

  it("search + source", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", source: "onedrive" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "source eq 'onedrive'",
    );
  });

  // combinations like search + author + updated, search + kind + updated, etc.
  it("search + kind + updated", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", kind: "image", updated_after: "2023-01-01T00:00:00Z" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'image' and updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("search + type + author", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", type: ["pdf"], author: "satriyo@hyperjump.tech" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and created_by eq 'satriyo@hyperjump.tech'",
    );
  });

  it("search + type + updated", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "hello",
        type: ["pdf"],
        updated_after: "2023-01-01T00:00:00Z",
        updated_before: "2023-12-31T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("search + author + source + updated", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "hello",
        author: "satriyo",
        source: "sharepoint",
        updated_after: "2023-01-01T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "created_by eq 'satriyo' and source eq 'sharepoint' and updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("search + kind + source", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      { search: "hello", kind: "video", source: "teams" },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'video' and source eq 'teams'",
    );
  });

  it("filter-only browse: type + kind without search", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool("search_file", { type: ["pdf"], kind: "document" }, SCSE);
    const url = (fm.mock.calls[0] as unknown as [URL])[0];
    expect(getSearch(url)).toBeNull();
    expect(getFilter(url)).toBe("extension eq 'pdf' and kind eq 'document'");
  });

  it("order is fixed regardless of input order", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool(
      "search_file",
      {
        search: "x",
        updated_before: "2023-12-31T00:00:00Z",
        source: "onedrive",
        author: "a",
        kind: "image",
        type: ["pdf"],
        updated_after: "2023-01-01T00:00:00Z",
      },
      SCSE,
    );
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and kind eq 'image' and created_by eq 'a' and source eq 'onedrive' and updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("author escaping single quote", async () => {
    const fm = stubFetch(200, { status: "ok", value: [] });
    await callTool("search_file", { search: "x", author: "a'b" }, SCSE);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "created_by eq 'a''b'",
    );
  });

  // negative cases: invalid params not required but should still error
  it("invalid kind returns invalidParams", async () => {
    const r = await callTool(
      "search_file",
      { search: "x", kind: "audio" as unknown as string },
      SCSE,
    );
    expect(r.status).toBe("invalidParams");
  });

  it("invalid updated date returns invalidParams", async () => {
    const r = await callTool(
      "search_file",
      { search: "x", updated_after: "01-01-2023" },
      SCSE,
    );
    expect(r.status).toBe("invalidParams");
  });

  it("invalid type returns invalidParams", async () => {
    const r = await callTool(
      "search_file",
      { search: "x", type: ["*invalid!"] },
      SCSE,
    );
    expect(r.status).toBe("invalidParams");
  });
});
