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
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTVEb0Jud2Y2NlNjNzdrWDIzWnhYK1lTYkwzMVlCV1V1U3ZOWHhYYjZIdEMzeXFFZDlXTGtUcVdtbzFKYjNJKy9ERE9vSitKbmFPdWRUejUxQ1hUSlFBPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTg3NzU0CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKc2RwU3dnRmQ0eVN5cXAzME9hNVlFSWVhRkVUQjFLeE9rbkVVN1orc0ZqU2NZNjFWTEx3V1QwR1NNL3VoeFVKaFREM2E5Yit5YkFXaExXemZkd2ZsQlE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXliMlVveHRRdVB3bENKN2VDQkpod0U2OVVuQ3ZzNlZjanlIdCtyM2RLMVFLMFpxWnhZblQwMVRBVVIwRDhSb3BLSTZ1RjlKb2ZCNlhwK0FiZXFZL2cwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTg3OTAwCWZpbGU6c2NzZS1kZXNrdG9wXzAuMy4wX3g2NF9lbi1VUy5tc2kKbWlIcXQzaXBFMDdES0lMRWN6RjAyZDZqMHpHcXNsb2haMTAvQnhyMW1IYWMvNFNOeUtOZkVHcnpYTkVBb28rWWo1V1p4SlcrTFBnNUExbVdESkR6QUE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXhGVmQ2SHZ4VnJWQjl4U1NOUEZ1QjkwYkVUc3NaY0pGRWlqY1pSNHpuTW4wY0xqdE9PU3JEYU8yL3l6cXY5Tm0vc2dGMnhEZ0Y0cStyNGJIQ2dXSGdVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTg2NTI4CWZpbGU6c2NzZS1kZXNrdG9wXzAuMy4wX2FtZDY0LkFwcEltYWdlCkZvN1RLWHF6V2V5RUdEeUZQQlpHdXpJcTAxM29QTFY2SUh5T2dtM005ejF0aEthWTRBV2FtZStpVUxHZzFaek1CK1h3a21QZnVPTGxnWWo0elAwUkJBPT0K",
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
