import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchColleagues,
  getPreferences,
  inviteColleagues,
  updatePreferences,
} from "./onedrive-settings";
import * as fetcherModule from "@/lib/fetcher";

describe("onedrive-settings actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPreferences", () => {
    it("returns preferences when response is ok", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockResolvedValue(
        new Response(JSON.stringify({ value: { auto_grant_enabled: true } }), {
          status: 200,
        }),
      );

      const result = await getPreferences();
      expect(result).toEqual({ auto_grant_enabled: true });
    });

    it("falls back to default auto_grant_enabled false on non-200 or network error", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockResolvedValue(
        new Response("Internal Server Error", { status: 500 }),
      );

      const result = await getPreferences();
      expect(result).toEqual({ auto_grant_enabled: false });

      vi.spyOn(fetcherModule, "fetcher").mockRejectedValue(
        new Error("Network failed"),
      );
      const networkResult = await getPreferences();
      expect(networkResult).toEqual({ auto_grant_enabled: false });
    });
  });

  describe("updatePreferences", () => {
    it("returns success true on 200 OK", async () => {
      const fetcherSpy = vi
        .spyOn(fetcherModule, "fetcher")
        .mockResolvedValue(new Response("{}", { status: 200 }));

      const result = await updatePreferences({ auto_grant_enabled: true });
      expect(result).toEqual({ success: true });
      expect(fetcherSpy).toHaveBeenCalledWith("/v1/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_grant_enabled: true }),
      });
    });

    it("returns error message when response fails with structured error", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Tenant setting restricted" },
          }),
          { status: 400 },
        ),
      );

      const result = await updatePreferences({ auto_grant_enabled: true });
      expect(result).toEqual({
        success: false,
        error: "Tenant setting restricted",
      });
    });

    it("handles unexpected fetcher exceptions gracefully", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockRejectedValue(
        new Error("Connection reset"),
      );

      const result = await updatePreferences({ auto_grant_enabled: true });
      expect(result).toEqual({
        success: false,
        error: "Connection reset",
      });
    });
  });

  describe("fetchColleagues", () => {
    it("fetches colleagues without query parameter", async () => {
      const colleaguesData = [
        {
          email: "colleague@example.com",
          auto_grant_enabled: true,
          status: "active" as const,
        },
      ];

      vi.spyOn(fetcherModule, "fetcher").mockResolvedValue(
        new Response(JSON.stringify({ value: colleaguesData }), {
          status: 200,
        }),
      );

      const result = await fetchColleagues();
      expect(result).toEqual(colleaguesData);
    });

    it("fetches colleagues with query parameter properly encoded", async () => {
      const fetcherSpy = vi
        .spyOn(fetcherModule, "fetcher")
        .mockResolvedValue(
          new Response(JSON.stringify({ value: [] }), { status: 200 }),
        );

      await fetchColleagues("alice bob@example.com");
      expect(fetcherSpy).toHaveBeenCalledWith(
        "/v1/onedrive/colleagues?query=alice%20bob%40example.com",
      );
    });

    it("returns empty array when endpoint returns non-ok or throws", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockResolvedValue(
        new Response("Forbidden", { status: 403 }),
      );

      const result = await fetchColleagues();
      expect(result).toEqual([]);

      vi.spyOn(fetcherModule, "fetcher").mockRejectedValue(
        new Error("Timeout"),
      );
      const thrownResult = await fetchColleagues();
      expect(thrownResult).toEqual([]);
    });
  });

  describe("inviteColleagues", () => {
    it("returns success true on successful invite call", async () => {
      const fetcherSpy = vi
        .spyOn(fetcherModule, "fetcher")
        .mockResolvedValue(new Response("{}", { status: 200 }));

      const result = await inviteColleagues(["test@example.com"]);
      expect(result).toEqual({ success: true });
      expect(fetcherSpy).toHaveBeenCalledWith("/v1/onedrive/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: ["test@example.com"] }),
      });
    });

    it("returns error message when server responds with failure payload", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Recipient domain not permitted" },
          }),
          { status: 400 },
        ),
      );

      const result = await inviteColleagues(["evil@external.com"]);
      expect(result).toEqual({
        success: false,
        error: "Recipient domain not permitted",
      });
    });

    it("handles fetch rejection gracefully", async () => {
      vi.spyOn(fetcherModule, "fetcher").mockRejectedValue(
        new Error("Service unreachable"),
      );

      const result = await inviteColleagues(["test@example.com"]);
      expect(result).toEqual({
        success: false,
        error: "Service unreachable",
      });
    });
  });
});
