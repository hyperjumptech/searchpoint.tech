/** @vitest-environment jsdom */
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ConsentClient } from "./page.client";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const baseProps = {
  state: "state-token",
  clientId: "cursor-mcp",
  clientName: "Cursor",
  scopes: "search",
  userEmail: "a@b.com",
  ttlDays: 30,
  resourceName: "SearchPoint",
  tenantLogo: { src: "/icons/logo.svg", alt: "Sinarmas" },
  redirectUri: "http://127.0.0.1/cb",
};

describe("ConsentClient connection row", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows client initial, tenant logo, copy, and localhost hint", () => {
    // Act
    render(
      createElement(ConsentClient, {
        ...baseProps,
        logoDataUrl: null,
      }),
    );

    // Assert
    expect(screen.getByText("C")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Sinarmas" }).getAttribute("src"),
    ).toBe("/icons/logo.svg");
    expect(
      screen.getByText(/wants to access SearchPoint on behalf of a@b\.com/),
    ).toBeTruthy();
    expect(screen.getByText(/Make sure that you trust Cursor/)).toBeTruthy();
    expect(
      screen.queryByRole("heading", { level: 1, name: "SearchPoint" }),
    ).toBeNull();
  });

  it("shows client logo image instead of the initial avatar", () => {
    // Act
    const { container } = render(
      createElement(ConsentClient, {
        ...baseProps,
        logoDataUrl: TINY_PNG,
      }),
    );

    // Assert
    const clientLogo = container.querySelector(`img[src="${TINY_PNG}"]`);
    expect(clientLogo).toBeTruthy();
    const connectionRow = clientLogo?.closest(
      ".flex.items-center.justify-center.gap-2",
    );
    expect(connectionRow).toBeTruthy();
    expect(within(connectionRow as HTMLElement).queryByText("C")).toBeNull();
  });

  it("hides the localhost hint for non-loopback redirect URIs", () => {
    // Act
    render(
      createElement(ConsentClient, {
        ...baseProps,
        logoDataUrl: null,
        redirectUri: "https://app.example/cb",
      }),
    );

    // Assert
    expect(screen.queryByText(/Make sure that you trust/)).toBeNull();
  });
});
