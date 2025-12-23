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
    const latestVersion = "0.4.0";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Search on dekstop and Login SSO",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTN5OU9lR2ZVWHVMQnpBQWpIZXBBK0dHRmUya0gvSTVnYVJSN3FLZmpSa0h0MjJ3c1JjdmF3TktPVlc1N2dxYys4a2hXeE1rdUZVUXhsU1l6YzZ5ZlFVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY2NDYzMzkxCWZpbGU6U2VhcmNoUG9pbnQuYXBwLnRhci5negpnNFBzWHBucGFKcG1rUzB3bXRZMzJLTDE2UEptYkJOQXJtSUNhdmRuUkJLWUlUajVlSGNsMjg4SkJaMjZHMERYZE41UWh3bXlwNDIvb0VqS0FveFhBZz09Cg==",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/SearchPoint.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTRPc0VMcVN3M1dkdDhlSWhKYnBxQ3VjVm1xRDlpK0o5OFA1c1FTQ084VHZqY2xJRDhLaTlFRWJNdEFIbmh5RXg5K3B6SW1HT3BmdnFnY3pQbVlhMFFrPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY2NDYwOTA1CWZpbGU6U2VhcmNoUG9pbnRfMC40LjBfeDY0X2VuLVVTLm1zaQpyM01CNUNCYnF2c0FObHBxcEZyTjNGMFZId3JDSnZYSmt3dWphcmxPM0l1dGxWaEhUUUZhK3RmWlZVMVg4MUthN2NpOW05UHkxU1lRNFRiTERYUTFDUT09Cg==",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/SearchPoint_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXkwaTJlazh4N0hJdU1DVXNWTGVSYWhnYWZyY3BBVXRQeHEyUHZrV2MwaW4zd2VXQ0NyZHV0Z2RRZFYvdEdpR1d1c1REeldqM2FvMWl5QTQ0U1JPUEFvPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY2NDU5NDI0CWZpbGU6U2VhcmNoUG9pbnRfMC40LjBfYW1kNjQuQXBwSW1hZ2UKNm8yRDRoYTRxSzVoc3VGT1lUdExXek0vN1ZrTjhsbmVhbS9lOG9VeGcxNllVOXVwaWNFb2didG5GYkRrMll2WjhMays4QjBFVFBpZ3ZqV1ZtWFd0Qnc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/linux/SearchPoint_${latestVersion}_amd64.AppImage`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/SearchPoint_${latestVersion}_universal.dmg`,
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
