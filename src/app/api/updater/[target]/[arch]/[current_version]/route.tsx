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
    const latestVersion = "0.1.2";

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
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTVnaTVGUEJXOGNleURhK2ZyamMvUWxzTzU5MkVjOE5OMDZTb2JmVGJ5clNLVm9rUFN4WTZBV25xNTZ1YVdOelNjbm5KRlN1Vno0ajhNUEdpcXNRWGcwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMzM4NDcxCWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKWEhNVncxUDFaS1ZlVkUyeHkvL2FHY0MrMXcwNHUxRjU3SUhPUFl0U1RsM0lrelhOM1k0Y3ZFaDE0ZjladVo2YkxndWtKdk1CUHNRTmN5VnZYbE9YRHc9PQo=",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.2/macos-aarch64/scse-desktop.app.tar.gz",
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UThtekViL0pWTy9lVVlCUW9oL2xsM2tsL0VDdDN5aVJlbmpNQ1FQbERiRiswWEFJMlhWTVRHMjJTWTA2cXhadmdzeENCbk5nOU94ZGhrTGhydHVpS3c4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyNDA0MTQxCWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4yX3g2NC1zZXR1cC5leGUKNkl6QStobjQvSjZoYjlETDY1QU9FMENBdTkyUS9tYjdaVWFiaHZSRVNEU2FwSzVXblMyQ054Y3g5azZrbGliYnZpUTljc3pCbGJMQ2RaVkZGdEpGQkE9PQo=",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.2/windows/scse-desktop_0.1.2_x64-setup.exe",
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTRYSjhlL3NBQXVyZnBJRHFwYUZwNks3cHcra0VJNnZFZVBvdU51VzdWcXdGZUFGejloNndUcXRuM0I0YXIwZklxeG1OMjJ5VkZ6ZXQ3azBjVG84Q0FZPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMzM3MjM4CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4yX2FtZDY0LkFwcEltYWdlCmFoWGVkLzd0MklpdVNEdWpOU0lzTkRVV1N6bWxlU1A3VE9HYjNmWElzMkRFRzFuOTZUcFR5ekhuWllLNCtqMXFPN2RobHAxNjd5MFUwOE1JSmNmdUNRPT0K",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.2/linux/scse-desktop_0.1.2_amd64.AppImage",
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
