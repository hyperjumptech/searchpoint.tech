import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("/api/changelog/media route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 if neither path nor url is provided", async () => {
    const request = new NextRequest("https://example.com/api/changelog/media");
    const res = await GET(request);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing required");
  });

  it("rejects path traversal attempts", async () => {
    const request = new NextRequest(
      "https://example.com/api/changelog/media?path=../secret.txt",
    );
    const res = await GET(request);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid path");
  });

  it("proxies video from GitHub and returns correct video/mp4 MIME type", async () => {
    const dummyBytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => dummyBytes.buffer,
    } as unknown as Response);

    const request = new NextRequest(
      "https://example.com/api/changelog/media?path=videos/demo.mp4",
    );
    const res = await GET(request);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Length")).toBe(
      String(dummyBytes.byteLength),
    );
  });

  it("supports byte Range requests with HTTP 206 Partial Content", async () => {
    const dummyBytes = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => dummyBytes.buffer,
    } as unknown as Response);

    const request = new NextRequest(
      "https://example.com/api/changelog/media?path=demo.mp4",
      {
        headers: {
          Range: "bytes=2-5",
        },
      },
    );
    const res = await GET(request);

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
    expect(res.headers.get("Content-Range")).toBe("bytes 2-5/8");
    expect(res.headers.get("Content-Length")).toBe("4");

    const arrayBuffer = await res.arrayBuffer();
    const resultBytes = new Uint8Array(arrayBuffer);
    expect(resultBytes).toEqual(new Uint8Array([30, 40, 50, 60]));
  });

  it("converts GitHub blob URLs to raw URLs when fetching", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
    } as unknown as Response);

    const blobUrl =
      "https://github.com/hyperjumptech/searchpoint/blob/main/changelog/demo.webm";

    const request = new NextRequest(
      `https://example.com/api/changelog/media?url=${encodeURIComponent(blobUrl)}`,
    );
    const res = await GET(request);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("video/webm");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/hyperjumptech/searchpoint/main/changelog/demo.webm",
      expect.any(Object),
    );
  });
});
