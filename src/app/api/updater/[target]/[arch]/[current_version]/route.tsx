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
    const latestVersion = "0.1.12";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Run desktop app on background",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXpNem13K3Q4SEYxc2F4RDh1eFBPOThBT1VGTmRCN1BEeGM0NHUwYkdJSDdjSUNtWHhkc2NMdlZJUFRPR1duMzNGaUdLWTM4UjVrbXpqa09jMUJkWlFrPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0NTg3OTM5CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKM2dOU0lOK25qb0NNUWFNL2ExR2NmOU1XUDIxbW9BRUJPK09mZktNQzRhTkRZTU85a0FFNkNyOU84RDgwSVJWT0JKVG1aUFBFcXlBMzhZMXJyM0JaRHc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UStJQTF4T1drVm9PU2QxK3RTU09LbDlBSXJ1b2dpc0QyOXZhazRnbGIrTnR5RFpib3MzTjNFbUNVa0R3ZC9oYXpmbytnQjNqSTZvaUk0ZGl4RkJwL1E0PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0NTg3NzA0CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4xMl94NjRfZW4tVVMubXNpClBYTGdHM2ZCUmJrb1ErY0FFcVBXSkViR2xJY3hEWHBpREV3aTlLMzUzMFhuRW5zV0hYQi9TaG5JK1B3ZUNqZDhqTllpbTJFZUpkS1gvYlRwaXVqNEJnPT0K",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5US9VajgyNEN3aDJKT2pIRXJWNk5aNkpzM2tuSGlUTDJmc2NCTVlRODFqVFAzTDlZaTRuZlZBazBRdERxYnBKQjk2blU0Nk8wZzBEbXh6UzQwcXA4L3c4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0NTg4NzI2CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4xMl9hbWQ2NC5BcHBJbWFnZQp6VHZZQ2tmNmtRZDFJMzZEZUlCQitOKzhyT0x5LzFLZVppdUpLM1B5blR0dGYweU1kYTBlT0V5SHZibjlxVGtGSDVZMGJCREZQMDRvSjRHb3NUWllDQT09Cg==",
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
