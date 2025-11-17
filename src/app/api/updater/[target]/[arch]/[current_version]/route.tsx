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
    const latestVersion = "0.1.8";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Bug fixes and improvements",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTlIZGRsanlaSEhranlLQnRBTUtHb0R3OWtmclBLdTJMOGxLSGovRTRTUWNZNGE5RWQ2UHViZUhFb3dqMzZVKzg2RzlndzkrZVg2WnJpOUlJdWZoQlE0PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYzMzY0MTEzCWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKSkF3b1FZMEUwSHZQSmtTalNxRUl1WjI5Myt1SWtLZHQ2L3Nxd044bGJ2RFQ0UTJJTkp5Q1JPaWhPckx5R0pzemJndHZVbmpsV2tXYlA2NlVDcGxiQmc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTlOWUFvVTBaT20ybS9ySm90NHV5OXhQVXRZdFc3TzdtcncxSjBCYkpnL0grUER1UGgrNlViWUVuMGNQQWI4VTIrSWxCUFFXeHRzb3ZOdVFGSzlLYmdVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYzMzYzNzk4CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS44X3g2NF9lbi1VUy5tc2kKWmhxY3dBR2VoUUtVZW8zOG1PRENBQTY3TWpiNE1EMEpaUGMzQmExTXp5T2ZxdHBMNG1aVlVwTFM2VTBnbnlEclkyOHVLVGl0MlI3eVYzNnNPNFg2RGc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXlob2FVLzNKNDhwYnRLSERUWHVvelBlV0tWcHArVFZGSlBXSlorampBSVJnVVEzOVN4ZXk4d1JRdm1lZGwxbVJVcjRWS09uWlFEblg3UnJFOVlkckFJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYzMzY1MDcxCWZpbGU6c2NzZS1kZXNrdG9wXzAuMS44X2FtZDY0LkFwcEltYWdlCjFqT1ZLd3VhSVYvbEVvN2lMZFhvbVdVRDlHNG55ditONnlJbHdGV2hXYXJxUjkvZ052VlZ3bHlSc2VwNC80NWpYblZlcjZBV0orY3pwT3R6VG10S0NnPT0K",
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
