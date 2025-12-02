import { NextRequest, NextResponse } from "next/server";

interface TauriUpdateResponse {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    [key: string]: {
      signature: string;
      url: string;
    };
  };
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ target: string; arch: string; current_version: string }>;
  },
) {
  try {
    const { current_version } = await params;

    // Check if there's a newer version available
    const latestVersion = "0.2.0";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Auto start desktop app on system up",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXdGRVdBbkJKdzBVZ0VrN24wcWw4TFhGNEhPRnQzUWtQbWlDREsrM2ZVczY2T1lKYUdWL251eHU3V0I1YXN1WWxwWGE2SzNFMGtad3p4TXcyWXhjNXcwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0Njg5MTc4CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKWFozUTkvUzMrc0M5c1hrRHovS2VnV3U1TWl5cjUvb09ySEdicjVvdkNJWlVLbG0zWEJ5SXdJRlRaVWptTVZDKzJNUTAzWncwcTRrNW1OTEdGczVKREE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTBEZTNhRkFNT1Z0dHYvdG9GUGs1RkZCZVM2OEk4UEVoeXlEMUd5b0hlTHBxUTRxVldZamxPUDJ5WmsvZHJJTFNEMTBFTkZTWFNDalJwV0lNNlVUWFF3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0Njg5NTg5CWZpbGU6c2NzZS1kZXNrdG9wXzAuMi4wX3g2NF9lbi1VUy5tc2kKS0NHRnREVUlZa2poRkF1UXROdTBjanErL0s0NXJQUGlURjlZQ3dPQk5uejZZNHI4M29yeVhLKzJnWjU3V3lGcVVWVENCUFdhcTZ6NjViVWlMZlhDQnc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTZLUmZyQ0Y2K1ZIZ05hbnF5U3NlU0ZqbjNOR283SXBXRWptb1ZsQjAyRDJyWjRlMUcraW5aeXFWa3Q0RjgrSjlHa25jR3RvTzNleXM2N3FvVEo5dGdNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0Njg4MjUyCWZpbGU6c2NzZS1kZXNrdG9wXzAuMi4wX2FtZDY0LkFwcEltYWdlCi95cU1qM1AzeTZ0WGgySS94K3c3d2pyV2tvZ0ZwdDVGRDExbzh1THBITjhPWmlBUExGWW9SZDlxekVKTC9uVE1YY0V2Zzg5VHRQM0FCc2xMOGxiSURnPT0K",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/linux/scse-desktop_${latestVersion}_amd64.AppImage`,
        },
      },
    };

    return NextResponse.json(updateResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check for updates" + (error as Error).message },
      { status: 500 },
    );
  }
}
