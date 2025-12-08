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
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXlmUGdzSHVudExxWDZlRVpGeU8yWWN1MWVqd2NZbStOcnBJZEJtZUUzbkVZdC9oRnVKVGhYRkR4czg4ZzhVOHUwRVgyMDgySnhXejBoRDVwd2JhdEFNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTY3ODcxCWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKQXlDS29EMHhTOWorMFBmSWhzejIzaDZZQU0vdmhYdUk5cE4rZWVLdTB2ZDd5aldvSHdZVXhpM09HWXM5dGU4cmc1ZXZEZzNtc1NWZDd5dWdwN3lOREE9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/scse-desktop.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTlMcGhSakdVNTQzUUVMZ1BMVi9GZ1ozaFpFSmlaK0xPRGM5emhqVDhnMXU4MkxUTEkzMHRrN2k0RWJtVC9iOTg5Z0F2cXJ1UFlSSVhRUEFCSnU4Y2d3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTY3MDgyCWZpbGU6c2NzZS1kZXNrdG9wXzAuMi4xX3g2NF9lbi1VUy5tc2kKdGpNblpBSnJpaHBPY1RWYW1HekxUWkVWT2FzaEhlQW1rVGl6bWJHdVVGSVdTcXgzWEkwcU5pc1JnK2h0OW5FeGdKbXVUdFVkbmQwem1PdkZmdXZBQmc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/scse-desktop_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UThvUG01Q21JakxTY3d6emJpMUdxblhaN0tLL3RuakhwQlR0VDRPN3dLcDZTY2J2L0ZuVGV6NnFKSzFNSXdFbG8xcnJBOEFWcEYrYVlsci9zYzVoOUEwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY1MTY2NTgyCWZpbGU6c2NzZS1kZXNrdG9wXzAuMi4xX2FtZDY0LkFwcEltYWdlClpnVlRkSUcwK0ZtQjJmOUVocENiREZhNUVEblVLY0pPUW1OS09IelVXc0R5MDZPQ09KWU85SEUxUUdVM2k3bkhmMEp2dlhOcm5iU2x5UVM1VGZJNEFRPT0K",
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
