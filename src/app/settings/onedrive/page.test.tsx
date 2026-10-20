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
        hasActiveConnection: true,
      }),
    );

    expect(screen.getByText("OneDrive Search Settings")).toBeDefined();
    expect(screen.getByText("me@company.com")).toBeDefined();
    const toggle = screen.getByRole("switch", {
      name: "Let colleagues find your files",
    });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getAllByTestId("colleagues-info-icon")).toHaveLength(1);
    expect(
      screen.queryByText("Invite colleagues to let others find their files"),
    ).toBeNull();
  });

  it("defaults hasActiveConnection to false when prop is omitted", () => {
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: false,
      }),
    );

    expect(screen.getByText("OneDrive not connected")).toBeDefined();
    expect(
      screen.queryByRole("switch", {
        name: "Let colleagues find your files",
      }),
    ).toBeNull();
  });

  it("displays only unconnected notice and hides other cards when hasActiveConnection is false", () => {
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: false,
        hasActiveConnection: false,
      }),
    );

    expect(screen.getByText("OneDrive not connected")).toBeDefined();
    expect(
      screen.queryByRole("switch", {
        name: "Let colleagues find your files",
      }),
    ).toBeNull();
    expect(screen.queryByText("Let colleagues find your files")).toBeNull();
    expect(screen.queryByText("Privacy & Security Guarantees")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /open in searchpoint desktop app/i })
        .getAttribute("href"),
    ).toBe("searchpoint://");
    expect(
      screen.getByRole("link", { name: /download app/i }).getAttribute("href"),
    ).toBe("/#download");
  });

  it("toggles preference on and off with server action call and reveals invite card", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: false,
        hasActiveConnection: true,
      }),
    );

    expect(
      screen.queryByText("Invite colleagues to let others find their files"),
    ).toBeNull();

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
    expect(
      screen.getByText("Invite colleagues to let others find their files"),
    ).toBeDefined();

    // Toggle back off
    await user.click(toggle);
    await waitFor(() => {
      expect(actions.updatePreferences).toHaveBeenCalledWith({
        auto_grant_enabled: false,
      });
      expect(toggle.getAttribute("aria-checked")).toBe("false");
    });
    expect(
      screen.queryByText("Invite colleagues to let others find their files"),
    ).toBeNull();
  });

  it("opens invite dialog and displays registered colleagues", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
        hasActiveConnection: true,
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
        hasActiveConnection: true,
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
        hasActiveConnection: true,
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
        hasActiveConnection: true,
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

  it("prevents selecting colleagues who already have access enabled and rejects typing their email", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
        hasActiveConnection: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /invite colleagues/i }),
    );

    const input = screen.getByPlaceholderText(
      "Enter registered colleague's email...",
    );

    // Focus input to open dropdown
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("bob@company.com")).toBeDefined();
    });

    // The option for bob should have Access On badge and be disabled
    expect(screen.getByText("Access On")).toBeDefined();
    const bobBtn = screen.getByText("bob@company.com").closest("button");
    expect(bobBtn?.hasAttribute("disabled")).toBe(true);

    // Clicking disabled button should not add recipient
    if (bobBtn) await user.click(bobBtn);
    expect(screen.queryByLabelText("Remove bob@company.com")).toBeNull();

    // Typing bob's email manually and pressing enter should show validation error
    await user.type(input, "bob@company.com{enter}");
    expect(
      screen.getByText(
        /"bob@company\.com" already has search access enabled and does not need an invitation\./i,
      ),
    ).toBeDefined();
    expect(screen.queryByLabelText("Remove bob@company.com")).toBeNull();
  });

  it("displays server error message when inviting recently invited colleague", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.fetchColleagues).mockResolvedValueOnce([
      {
        email: "charlie@company.com",
        auto_grant_enabled: false,
        status: "invited",
        last_invited_at: new Date().toISOString(),
      },
    ]);
    vi.mocked(actions.inviteColleagues).mockResolvedValueOnce({
      success: false,
      error:
        "invitation already sent to charlie@company.com, please wait 24 hours to resend",
    });

    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
        hasActiveConnection: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /invite colleagues/i }),
    );

    const input = screen.getByPlaceholderText(
      "Enter registered colleague's email...",
    );
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("charlie@company.com")).toBeDefined();
    });

    // Option should have Invited recently badge and be clickable
    expect(screen.getByText("Invited recently")).toBeDefined();
    await user.click(screen.getByText("charlie@company.com"));

    // Tag added
    expect(screen.getByLabelText("Remove charlie@company.com")).toBeDefined();

    // Click Send
    const sendBtn = screen.getByRole("button", { name: /send invite/i });
    await user.click(sendBtn);

    // Displays the exact error message from server
    await waitFor(() => {
      expect(
        screen.getByText(
          "invitation already sent to charlie@company.com, please wait 24 hours to resend",
        ),
      ).toBeDefined();
    });
  });

  it("resolves recipient from allColleaguesRef cache when typed email is not in current active query results", async () => {
    const user = userEvent.setup();
    render(
      createElement(OneDriveSettingsClient, {
        email: "me@company.com",
        initialAutoGrantEnabled: true,
        hasActiveConnection: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /invite colleagues/i }),
    );

    // Initial fetch returns [alice@company.com, bob@company.com]
    await waitFor(() => {
      expect(actions.fetchColleagues).toHaveBeenCalledTimes(1);
    });

    const input = screen.getByPlaceholderText(
      "Enter registered colleague's email...",
    );

    // Type a search query that returns only david
    vi.mocked(actions.fetchColleagues).mockResolvedValueOnce([
      {
        email: "david@company.com",
        auto_grant_enabled: false,
        status: "not_invited",
      },
    ]);

    await user.type(input, "dav");
    await waitFor(() => {
      expect(screen.getByText("david@company.com")).toBeDefined();
    });

    // Alice is no longer in active query results (only david is)
    expect(screen.queryByText("alice@company.com")).toBeNull();

    // Clear and manually type alice@company.com (present only in allColleaguesRef cache)
    await user.clear(input);
    await user.type(input, "alice@company.com{enter}");

    // Should resolve safely from allColleaguesRef without throwing
    expect(screen.getByLabelText("Remove alice@company.com")).toBeDefined();
  });
});
