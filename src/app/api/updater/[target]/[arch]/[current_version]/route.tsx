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
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTlBOWgrOWNNcitBNis4aEpoZmp2UWU4WFBVYUJxbUVwRmg2SjcwR2tWUVpQenUxNDNHdk9oMzJ5Z0tGNmxrM1NFWXV4bUp1OWFLOTRUQkpLZVhtUlFjPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMjQ2MTc5CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKc2NsN2g5TGd4L0pESHcwUk95QnZmL2NLc3dzajY0dkdIZlhYVmNYeHhyU1IxUzNsNjI2MWU2QzV0KzQxTWlweVdnUjQ1cWRQTDN0aXRSZFM3bVdDQlE9PQo=",
          url: "https://dev.azure.com/parsec2018/_apis/resources/Containers/37847575/bundle-macos-aarch64?itemPath=bundle-macos-aarch64%2Fscse-desktop.app.tar.gz",
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5USs5KzFiUUFZVWtOK3gzWDZLS2hUSWtPTzFtZjZKcm1MbElvUzBZdTBROEI1TTN6YnN1Tytab1drM0IxQU0rRUZWQUx6azBITTcva2V0TUt4YmFOSXdNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMjQ2MTU0CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4yX3g2NC1zZXR1cC5leGUKOWpiL2FMSkhoWTJpZTQzcXJCdGJBR0JqS0wvSFBWYnpJNGhQMzlTMllRbzFJcnlqREFOejIxbDVvQndFbzd4WXVUdS9sdW5wYXh4WUlpYmgrbTdHQ3c9PQo=",
          url: "https://dev.azure.com/parsec2018/_apis/resources/Containers/37847575/bundle-windows?itemPath=bundle-windows%2Fscse-desktop_0.1.2_x64-setup.exe",
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5US9VNFdnclFCYm95cTRLdVg4L1Q5Y1lzaWZXOEZ2Y1loaitmOE45aFM0UDRIZHFOOU1CWmVmRVB2OWNYaUM3L2hmNXNQU2M3dmM5dmtaMkpJWS93dVFjPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMjQ3MTkxCWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4yX2FtZDY0LkFwcEltYWdlCjN1eEI5VlRqTHQ0dEU3eEQ1MzdSYlVVSWM3blE2MU1MS21wT2dBS1hnOGl4MVh5YTltZE4wVmdFOWY2amR4QkhtQ0Y3V2hPU3dVS0xEakhta2RSbER3PT0K",
          url: "https://dev.azure.com/parsec2018/_apis/resources/Containers/37847575/bundle-linux?itemPath=bundle-linux%2Fscse-desktop_0.1.2_amd64.AppImage",
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
