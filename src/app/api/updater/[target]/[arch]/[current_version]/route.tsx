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
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5US9NR1pPSlFUcEpjM2lRMFN6SGROeEFGdzN0ZmgxWTZtNWpNL3I3SkNCdWdXNW1yYi9xYld2aUttN0p4NHVCcEREVmpiSHJuSFZpNFA4RldWeGVmSWdVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyODU5Mjg4CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKOUNNTk5OMXBKZEd3dmF2dXAzNzI4Q0VxWm94c1V5WWRlWStjMXNJbUJrVE5EdEZUREI2V0hsQ3lyc0xzTHhmaFZrcWZFSE04NW9xOUhDeHQ0ekxsQlE9PQo=",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.5/macos/scse-desktop.app.tar.gz",
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTljMFMzWno2WWVJaGYzNTZ0cDRYLzBZTEJVYjdGN0dtKzFtNkFwa1RyN0hVb0VXb2FnVXh0bDJrMlA5alo2RW9yNFNJSWo5eU92K1c2Sml0ZlJieGdrPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyODU3MzgxCWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4yX3g2NF9lbi1VUy5tc2kKWFFPdzcxc1VkR2hzcFZIWEJxWkZRdmZtLzkzRXA4dVFaL3d6Vy9pMzcyZ25OTkhuL28xV000cFNjR3hyZVV4d3h3QlRiRWNSSzg0cW1oK3lpZ0JkRGc9PQo=",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.5/windows/scse-desktop_0.1.2_x64_en-US.msi",
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTNxWUdZUXowalBZY2ROMU5IZ1d6c0FudVN4dzIrVVA2ank5KzFFRkxzOW5POG1hWU9pWkt1UFBKVGJvUzhaM2hlTCtWc0ZtTWkrU0pSdWhQWHlKNVE4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyODU3MTg1CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS4yX2FtZDY0LkFwcEltYWdlCkp6d3UyVEpXL0F6Q3l2a1gxZTJ2YWNaYWZMRnhMZ0VhSDBTL2J5Z2ZaWkszY0NkVUZKWVM2MlZQdDk1a0N5SlFYOEZGK1orbjVPYXlNa0wvUGEyS0N3PT0K",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.5/linux/scse-desktop_0.1.2_amd64.AppImage",
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
