/** @vitest-environment jsdom */
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OneDriveSettingsClient } from "./page.client";
import * as actions from "@/actions/onedrive-settings";

vi.mock("@/actions/onedrive-settings", () => ({
  updatePreferences: vi.fn(),
  fetchColleagues: vi.fn(),
  inviteColleagues: vi.fn(),
}));

describe("OneDriveSettingsClient", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(actions.updatePreferences).mockResolvedValue({ success: true });
    vi.mocked(actions.fetchColleagues).mockResolvedValue([
      {
        email: "alice@company.com",
        auto_grant_enabled: false,
        status: "not_invited",
      },
      {
        email: "bob@company.com",
        auto_grant_enabled: true,
        status: "active",
      },
    ]);
    vi.mocked(actions.inviteColleagues).mockResolvedValue({ success: true });
  });

  it("renders the account email and initial toggle state correctly", () => {
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: false,
      }),
    );

    expect(screen.getByText("OneDrive Search Settings")).toBeDefined();
    expect(screen.getByText("me@company.com")).toBeDefined();
    const toggle = screen.getByRole("switch", {
      name: "Let colleagues find your files",
    });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getAllByTestId("colleagues-info-icon")).toHaveLength(2);
  });

  it("toggles preference on and off with server action call", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: false,
      }),
    );

    const toggle = screen.getByRole("switch", {
      name: "Let colleagues find your files",
    });

    await user.click(toggle);

    await waitFor(() => {
      expect(actions.updatePreferences).toHaveBeenCalledWith({
        auto_grant_enabled: true,
      });
      expect(toggle.getAttribute("aria-checked")).toBe("true");
    });

    // Toggle back off
    await user.click(toggle);
    await waitFor(() => {
      expect(actions.updatePreferences).toHaveBeenCalledWith({
        auto_grant_enabled: false,
      });
      expect(toggle.getAttribute("aria-checked")).toBe("false");
    });
  });

  it("opens invite dialog and displays registered colleagues", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
      }),
    );

    const inviteBtn = screen.getByRole("button", {
      name: /invite colleagues/i,
    });
    await user.click(inviteBtn);

    expect(
      screen.getByText("Ask teammates to turn on OneDrive search access."),
    ).toBeDefined();
    expect(screen.getAllByTestId("colleagues-info-icon")).toHaveLength(3);

    await waitFor(() => {
      expect(actions.fetchColleagues).toHaveBeenCalled();
    });
  });

  it("strictly enforces registered colleagues only and allows sending invite", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /invite colleagues/i }),
    );

    const input = screen.getByPlaceholderText(
      "Enter registered colleague's email...",
    );

    // Try adding an unregistered email
    await user.type(input, "unregistered@external.com{enter}");

    expect(
      screen.getByText(
        /"unregistered@external\.com" is not a registered SearchPoint user\. Only registered company colleagues can be invited\./i,
      ),
    ).toBeDefined();
    expect(actions.inviteColleagues).not.toHaveBeenCalled();

    // Now select a registered colleague from dropdown
    await waitFor(() => {
      expect(screen.getByText("alice@company.com")).toBeDefined();
    });

    await user.click(screen.getByText("alice@company.com"));

    // Verify tag is added
    expect(screen.getByText("alice@company.com")).toBeDefined();

    // Click Send Invites
    const sendBtn = screen.getByRole("button", { name: /send invite/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(actions.inviteColleagues).toHaveBeenCalledWith([
        "alice@company.com",
      ]);
    });
  });

  it("closes the colleague suggestions list when an item is selected or on Escape", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /invite colleagues/i }),
    );

    const input = screen.getByPlaceholderText(
      "Enter registered colleague's email...",
    );

    // Focus input to open suggestions
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("alice@company.com")).toBeDefined();
    });

    // Pressing Escape should close dropdown
    await user.keyboard("{Escape}");
    expect(screen.queryByText("alice@company.com")).toBeNull();

    // Re-focus opens dropdown again
    await user.click(input);
    await waitFor(() => {
      expect(screen.getByText("alice@company.com")).toBeDefined();
    });

    // Selecting colleague closes dropdown
    await user.click(screen.getByText("alice@company.com"));
    expect(screen.queryByText("bob@company.com")).toBeNull();

    // Send button is visible and active
    const sendBtn = screen.getByRole("button", { name: /send invite/i });
    expect(sendBtn.hasAttribute("disabled")).toBe(false);
  });

  it("does not trigger duplicate colleague fetch or flash dropdown on initial modal open", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /invite colleagues/i }),
    );

    // Initial load calls fetchColleagues once
    await waitFor(() => {
      expect(actions.fetchColleagues).toHaveBeenCalledTimes(1);
    });

    // Dropdown is not open by default (preventing layout jump / flicker)
    expect(screen.queryByText("alice@company.com")).toBeNull();

    // Fast forward or wait 600ms to ensure the debounced search does not trigger duplicate fetch
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(actions.fetchColleagues).toHaveBeenCalledTimes(1);
  });
});
