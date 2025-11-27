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
    const latestVersion = "0.1.10";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Fix restart watcher if adding folder",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTV4Q1hDT2VTQzQ5WXpwT2JiWFVXUEFYV1dKYmdEU09oQmZsZVh2Mk1KRXNKenBSNXk4NnFuUVliY2c0Z0tOMFBJR2lTOXAyRTBPL1VQTE13dDh2NkEwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MjIzNTc2CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKeXpFUURwTmZTRUZpaStDMXhEbk92OHRDWU5IWEh3Zm9aeWtmNFRTVGhWRUZrUHduMElDRzBQR3dFNHplcXl4ekt6czYvWnYvbXZKbnhhVndMVG5oQWc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTRQcDRhKzZGaUxpUWdTNWh3L1BGMjMyb3I0Yi9kYzlqWFJOTExJQVRuVGVRSXRyekFXRkFEL0dnbUlKbnVENWRUOG5GOHZBNWlXQ01LQVFGSVJNOWd3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MjIzMTE0CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4xMF94NjRfZW4tVVMubXNpCnRXVWV2MWNBVkxta3hXc3orRWlhSjNwNlJmUEh1d3EvNTlwd280NE1CY0JQS3pTbWcwWVNWZXJMWkFqelJremxGTXFKdXBBbVBaTmdRenRuN1pDL0RnPT0K",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTltWEVja3BzcUpjMU5YdEpia2dQcG1meHpZNjd6a1hDb3RMdnJadEhacDBvT1lTbHc1QlNzYkMyUExZQzVuYmQ1VTJhYldvZ1RUdWtUMzljYUJEaXdFPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MjI0MjE5CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4xMF9hbWQ2NC5BcHBJbWFnZQpYTThlWVNOOUxoWVR2LzAzY0o0Nm8vUlBSYjdUT24rcW9LWmpQQnBVUC9MSnhac0d4ODNERHNvdi9sejd5bzZmR0FjWlNLV2YrZVJrYlV4bkRZQUZEZz09Cg==",
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
