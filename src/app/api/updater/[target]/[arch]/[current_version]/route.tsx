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
    const latestVersion = "0.1.9";

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
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTlwNy93bDN6LzhxUFFyd0EyRndObmVuOFVHc2MveFZjWVZiWDZ6a0FuSEdreXlKRWFvcWRlL2puUzdoUzhybGJ6bTY5UTdEY3NhTVRJTm54ZytDYUFFPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MTM5MzYxCWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKYTVSQlVyUjBoekpZRWkxejZESzNCaVNJL1h1NXFadWNraUJhZHU3eWZXdWJ5NTNjcjlsaDRWeTR1RTFLTFZYNU9KRENQamtZMlVFMHNqY3Y3d1YxQkE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXhLaS9TeEJBcmZMZjdTdVc2d3V3Si96QWFsOUF2RWJ3KzV5WEI2cFNpTS9GeDdROUxVUTdaekk0UnNXMDArRHR5MzVHYUs4SnNsQWdHYytGcXpFTkFBPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MTM4ODMzCWZpbGU6c2NzZS1kZXNrdG9wXzAuMS45X3g2NF9lbi1VUy5tc2kKaXlvb3FjeEhYbmhodGRTdFJhK3dCMzVTSzZnSmFLQzZITUdobm9nSERFSDRFWXNIUGxIa1Uzb3ZDc2hzaXVkY0ZjRjFJSlpzZVo1K0xGUWtrRDRSQ1E9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UThrbUQvbStQYVVzMDBVSXVkWDlkV1Q3ZEVRL3VhYWdnZDhrb0ltVHhwVzVPY01hSjVHN1BKcEJOd2VFNHg4T1l3cW1UUTgrVEQ4YVVhaTNiY0dSZ0FzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY0MTQwMTM2CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS45X2FtZDY0LkFwcEltYWdlCjRFdmZrbUhseUk3bWJBQXZlTUlvdGJyOUhhZ0lYNXd4bURzemh6bk1xTWFRTytpV01VNTgvcGxET1FhdGExcG9xd1B2cG1lMDVpVkc3S09KOVIxUkRRPT0K",
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
