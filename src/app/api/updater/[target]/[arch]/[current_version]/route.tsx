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
    const latestVersion = "0.3.0";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Change app icon",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTZnVDdINmZYYmZLNUh1NERVb212YVRiTm5zTUlmbUxVbmlVejdPekg1L0lzUkZFUXFVYWNZRlU0bVJCbFAxU0pQODA5RWpIcUNRbitYWFJFYjNxWWdJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTgxMzE5CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKeXJQQ2ZCSC9JRzJqZEdhTUJwalk0UDNVcm82Qis3M25uaXk2elF4OU5qT2xBSGxqU2FKdGt1WnhBVlYvNk5lcGJ6MHpSVW1CK25JT2xidkIzQW41Q3c9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTI2QTFPYjJQRjZ4U0tBdS9sNUpodzFEU1F5VEpNYWE3TEVXMHJDSnVHWWRId0NES3A3UnZWckN2QzBCVENVVkJOc3FMY0F6ZHQxK2xFVXZnd3kvbXdJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTc5MTQ1CWZpbGU6c2NzZS1kZXNrdG9wXzAuMi4xX3g2NF9lbi1VUy5tc2kKMGxMY0lCaHNuai9taDI4V0U3WXdteWhvTVhMNUtGOGFTeGd4TFYrejhrNmJaSURDY1k4ZktiaVprZmZjY2FkRSsrUWYrZklSNVVBd2J3VUppekxuREE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTJCMFUxYnZpU0tOVStjR3BxZ2xnek9DSkJ4TVVWcEs3TWFpZkJQblRMM2FtOGlGdUxqVldySjdCcmFUK3FkalNNakRlaGFURnJhdUticTcxTUVOVXd3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTc5MDE4CWZpbGU6c2NzZS1kZXNrdG9wXzAuMi4xX2FtZDY0LkFwcEltYWdlCjdMcG5pM29QWEtaOFF0MnNMSUVYN3ZKL3lRZ2dEMEdHMTRTOUtaNjFueXNvbWltNXhxTlpHNmhQT2EyZm9ROFhhWWZBNGN1UFloSEgzM00yNysrWERnPT0K",
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
