import { describe, expect, it, vi } from "vitest";
import OneDriveSettingsPage from "./page";
import * as meActions from "@/actions/me";
import * as onedriveActions from "@/actions/onedrive-settings";

vi.mock("@/actions/me", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/actions/onedrive-settings", () => ({
  getPreferences: vi.fn(),
  getConnections: vi.fn(),
  updatePreferences: vi.fn(),
  fetchColleagues: vi.fn(),
  inviteColleagues: vi.fn(),
}));

describe("OneDriveSettingsPage server component", () => {
  it("forces initialAutoGrantEnabled to false when connection is not active even if prefs are enabled", async () => {
    vi.mocked(meActions.getMe).mockResolvedValue({
      email: "user@company.com",
      name: "Test User",
    });
    vi.mocked(onedriveActions.getPreferences).mockResolvedValue({
      auto_grant_enabled: true,
    });
    vi.mocked(onedriveActions.getConnections).mockResolvedValue([
      { id: 1, status: "disconnected" },
    ]);

    const pageElement = await OneDriveSettingsPage();
    const clientProps = pageElement.props.children.props;

    expect(clientProps.hasActiveConnection).toBe(false);
    expect(clientProps.initialAutoGrantEnabled).toBe(false);
    expect(clientProps.email).toBe("user@company.com");
  });

  it("passes initialAutoGrantEnabled as true when connection is active and prefs are enabled", async () => {
    vi.mocked(meActions.getMe).mockResolvedValue({
      email: "user@company.com",
      name: "Test User",
    });
    vi.mocked(onedriveActions.getPreferences).mockResolvedValue({
      auto_grant_enabled: true,
    });
    vi.mocked(onedriveActions.getConnections).mockResolvedValue([
      { id: 1, status: "active" },
    ]);

    const pageElement = await OneDriveSettingsPage();
    const clientProps = pageElement.props.children.props;

    expect(clientProps.hasActiveConnection).toBe(true);
    expect(clientProps.initialAutoGrantEnabled).toBe(true);
  });

  it("handles empty connections list safely as hasActiveConnection false", async () => {
    vi.mocked(meActions.getMe).mockResolvedValue(null);
    vi.mocked(onedriveActions.getPreferences).mockResolvedValue({
      auto_grant_enabled: false,
    });
    vi.mocked(onedriveActions.getConnections).mockResolvedValue([]);

    const pageElement = await OneDriveSettingsPage();
    const clientProps = pageElement.props.children.props;

    expect(clientProps.hasActiveConnection).toBe(false);
    expect(clientProps.initialAutoGrantEnabled).toBe(false);
  });
});
