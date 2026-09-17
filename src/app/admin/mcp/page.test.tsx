/** @vitest-environment jsdom */
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { McpAdminClient } from "./page.client";

const client = {
  clientId: "searchpoint-mcp-1",
  name: "OpenCode",
  redirectUri: "http://127.0.0.1:4321/callback",
  scopes: ["search"],
  enabled: true,
  revoked: false,
  createdAt: "2026-09-15T12:34:00.000Z",
  updatedAt: "2026-09-15T12:34:00.000Z",
  clientSecret: "hidden-secret",
};
const response = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("static OAuth client admin UI", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  let clipboardWrite: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockReturnValue(
          response({ clients: [], allowedScopes: ["search", "files"] }),
        ),
    );
    clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
  });

  it("creates a client, shows secret once, and redacts secrets from the list", async () => {
    const user = userEvent.setup(),
      fetchMock = vi.mocked(fetch);
    render(createElement(McpAdminClient));
    await user.click(
      await screen.findByRole("button", { name: /add oauth client/i }),
    );
    await user.type(screen.getByLabelText("Name"), "OpenCode");
    await user.type(screen.getByLabelText("Redirect URI"), client.redirectUri);
    const filesScope = screen.getByRole("checkbox", { name: "Scope files" });
    await user.click(filesScope);
    expect((filesScope as HTMLInputElement).checked).toBe(true);
    fetchMock.mockReturnValueOnce(
      response({ client, clientSecret: "one-time-secret" }, 201),
    );
    await user.click(screen.getByRole("button", { name: /create client/i }));
    expect(await screen.findByText("Save these credentials now")).toBeTruthy();
    expect(screen.getByDisplayValue("one-time-secret")).toBeTruthy();
    expect(screen.queryByText("client_secret_hash")).toBeNull();
    const copySpy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(screen.getByRole("button", { name: /copy credentials/i }));
    expect(copySpy).toHaveBeenCalledWith(
      expect.stringContaining("one-time-secret"),
    );
    expect(screen.queryByText("hidden-secret")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: /i saved the secret/i }),
    );
    expect(screen.queryByDisplayValue("one-time-secret")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/mcp/clients",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "OpenCode",
          redirectUri: client.redirectUri,
          scopes: ["search", "files"],
        }),
      }),
    );
  });

  it("edits and toggles a rendered client", async () => {
    const user = userEvent.setup(),
      fetchMock = vi.mocked(fetch);
    fetchMock.mockReturnValueOnce(
      response({ clients: [client], allowedScopes: ["search"] }),
    );
    render(createElement(McpAdminClient));
    await user.click(
      await screen.findByRole("button", { name: "Edit OpenCode" }),
    );
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated");
    fetchMock.mockReturnValueOnce(
      response({ client: { ...client, name: "Updated" } }),
    );
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/mcp/clients/searchpoint-mcp-1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    fetchMock.mockReturnValueOnce(
      response({ client: { ...client, name: "Updated", enabled: false } }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Disable Updated" }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/admin/mcp/clients/"),
        expect.objectContaining({ body: JSON.stringify({ enabled: false }) }),
      ),
    );
    fetchMock.mockReturnValueOnce(
      response({ client: { ...client, name: "Updated", enabled: true } }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Enable Updated" }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/admin/mcp/clients/"),
        expect.objectContaining({ body: JSON.stringify({ enabled: true }) }),
      ),
    );
  });

  it("requires confirmation for rotation and revoke", async () => {
    const user = userEvent.setup(),
      fetchMock = vi.mocked(fetch);
    fetchMock.mockReturnValueOnce(
      response({ clients: [client], allowedScopes: ["search"] }),
    );
    render(createElement(McpAdminClient));
    await user.click(
      await screen.findByRole("button", {
        name: /rotate secret for opencode/i,
      }),
    );
    expect(
      screen.getByText(/current secret is immediately invalidated/i),
    ).toBeTruthy();
    fetchMock.mockReturnValueOnce(response({ clientSecret: "rotated" }));
    await user.click(screen.getByRole("button", { name: /rotate secret$/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/mcp/clients/searchpoint-mcp-1/rotate-secret",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(await screen.findByDisplayValue("rotated")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: /i saved the secret/i }),
    );
    await user.click(screen.getByRole("button", { name: /revoke opencode/i }));
    expect(
      screen.getByText(/immediately invalidates the client/i),
    ).toBeTruthy();
    fetchMock.mockReturnValueOnce(
      response({ client: { ...client, revoked: true, enabled: false } }),
    );
    await user.click(screen.getByRole("button", { name: /revoke client/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/mcp/clients/searchpoint-mcp-1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });
});
