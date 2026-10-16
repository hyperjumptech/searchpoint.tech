"use server";

import { fetcher } from "@/lib/fetcher";

export interface UserPreferences {
  auto_grant_enabled: boolean;
}

export interface Colleague {
  email: string;
  auto_grant_enabled: boolean;
  last_invited_at?: string;
  status: "active" | "invited" | "not_invited";
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const res = await fetcher("/v1/preferences");
    if (!res.ok) {
      return { auto_grant_enabled: false };
    }
    const data = await res.json();
    return data.value || { auto_grant_enabled: false };
  } catch {
    return { auto_grant_enabled: false };
  }
}

export async function updatePreferences(
  prefs: Partial<UserPreferences>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetcher("/v1/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        success: false,
        error: body?.error?.message || "Failed to update preference",
      };
    }
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update preference";
    return {
      success: false,
      error: message,
    };
  }
}

export async function fetchColleagues(query?: string): Promise<Colleague[]> {
  try {
    const url = query
      ? `/v1/onedrive/colleagues?query=${encodeURIComponent(query)}`
      : `/v1/onedrive/colleagues`;
    const res = await fetcher(url);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.value || [];
  } catch {
    return [];
  }
}

export async function inviteColleagues(
  recipients: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetcher("/v1/onedrive/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        success: false,
        error: body?.error?.message || "Failed to send invitations",
      };
    }
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to send invitations";
    return {
      success: false,
      error: message,
    };
  }
}
