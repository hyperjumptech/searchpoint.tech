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
    const latestVersion = "0.1.11";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Fixed file watcher not detect file for cut-paste",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UStocG11MHY3WWR2WGZBT2RXV0JSS1pkb2NXTnpEYy8ram1qUm5la1R3YXl5aHc1WW5YTm1vWjduazdxRW9nVDJLRWJNd2cyRnBQOFByVUFreVU2dkFNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MjQxMjg3CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKZUdpVGQyUHpxRE1CTDcxc05CQVFxdjFFdDVNVS9zTnFXZm81RlFBQlZFNnM1eXhJdngzV0F1MzYwRTgxdnBlQTRJYmpHY3drekErL2NTOXVzc2hBQ3c9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTNvY0FVakE5MGx6ZDZ6a2xpaHQxWTRtT21RVlVWS1hWQ1pFSG9jS3k2SzdvTklRbmd3SUdaa0k1N1c4SEdlbHN1ZlN6VW1yZmtNN3EvR29sRXBaeGdvPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MjQwMjA5CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4xMV94NjRfZW4tVVMubXNpCnJjVWIzTnc3TlZPUDlnbFBZQ21CeTVQMEJNalVMWWoyemJlaE5OVmhkeVhxT2k4WXUzRURHK1hhT3JTNlE4dlpNZ3NianB4aTh6OEkrcUd0bk9oU0FRPT0K",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXdlTGRLUzFhOTJOYWd4YUQxd3VGSXBXdCs5TXZXSU84bHRZcGZNeS9mcDlZdGVNRktxQXJockpGbHVHa2o2UEk5VDhuNmJMeklIT2dzK2hOV1F6MlFNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MjQxMjQ4CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4xMV9hbWQ2NC5BcHBJbWFnZQpHWVJTRVEvMjN2QTVEU2krMHorMFRsOGY1eWVwL1ViWFErV09tK05jOXMwZWxWZ2txMzJSRlVmcGZIaUV2ME9uNzdzUThzaUlzZ0tzZGhESWx6T1pCUT09Cg==",
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
