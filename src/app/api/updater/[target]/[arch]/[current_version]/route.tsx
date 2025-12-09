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
    const latestVersion = "0.3.1";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Auto Indexing and Folder Size Checking",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXkvN1RBUmlDQjRWM2FFdmNYV3o1Q3BTRmdzcGtzdzkyQkVBWXZRWHZzckgxcnJ1YUxSaTcwUEhKY2g2bWpsLzV1TGFTQ21WeVFPeVZYRVZ2L0tmcHc4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MjY2OTQ4CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKK2NmeG04NWpaRzBKM1QwVllYSDJKalhMTVJwdElneGs5VjZhM3dYbkNEQlB2L1M4TXJlanVwSmVtdGZMaGhPTEliMUF0OHhUelI3azVJZCtBSVFDQXc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTZmQ1Q2aVh5bDhNaHZVc2xhZTlPWVNoQ3RKQTQydWw0dENBT2htU0dwb3U3Rm5WdVFid0N1Z2djQ2ZYV2U2Ny9DSE5zcXY4Tk1EM2NYN0cxdGNIOXdvPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MjY3MTE1CWZpbGU6c2NzZS1kZXNrdG9wXzAuMy4xX3g2NF9lbi1VUy5tc2kKMUFML2FKNjQ3bVJoRExVNkZqTnZCQU82eUxidnB0NWQycG84bmFNUHIvbWZWVG1rRGVEaU8yTlMyYU9JV2xyZk9xalNYMXpXTGFERUkyYy9HR0lkREE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UThKWTNVb0NJcER3VVp2QWZNRHlhYnpadkxNNjdFYXR6b2oyV0tDRDR2enU0VVgvYVNPeTZEOTE2ZjhDRC9ieUdmdmYxRWl0SVdjdmhKbkRrUmdJWWc4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MjY2MDQ0CWZpbGU6c2NzZS1kZXNrdG9wXzAuMy4xX2FtZDY0LkFwcEltYWdlCkdGbjFHamJBMUxYYW4xY2M2dVFLRGo0ZWpTQ2NINVdRZnE4L2lGQ1JvSUxGRGpMV29qU0RQL3BKQTU5YkxKbU9tK0MvZklxODRNQmh6VElQMFdXdUFBPT0K",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/linux/scse-desktop_${latestVersion}_amd64.AppImage`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop_${latestVersion}_universal.dmg`,
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
