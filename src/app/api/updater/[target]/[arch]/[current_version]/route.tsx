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
  }
) {
  try {
    const { current_version } = await params;

    // Check if there's a newer version available
    const latestVersion = "0.1.2";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    // TODO: update with real signatures and URLs after building with signature is available on pipeline
    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Bug fixes and improvements",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTJaQnl0Y0VjaUx1UmtyYkU0TDBNcEpYWDJrQjJmZSs4cWpNeHJFd01qZzdENW8xRm8ya2E3NU15d25vN2o5ODU5aTJvQUh2dFlramdqZzF1a01KMFFRPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMTg3NDE4CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKQXpCYXdBTXZIMzZGRk1nS09Nc0dLeFlDeVBGVlRwRkowb0Q2VXNSL0o5c3pjeWo4bXlHNnhPSWFvZ1ZNNGpoL21EQ3pwVUNobXUwZUxKUVRTd3cxQ1E9PQo=",
          url: "https://drive.google.com/uc?export=download&id=1B3Tm5pMF119IM4b6XjuZYCzm2SrgoFge",
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTJaQnl0Y0VjaUx1UmtyYkU0TDBNcEpYWDJrQjJmZSs4cWpNeHJFd01qZzdENW8xRm8ya2E3NU15d25vN2o5ODU5aTJvQUh2dFlramdqZzF1a01KMFFRPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMTg3NDE4CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKQXpCYXdBTXZIMzZGRk1nS09Nc0dLeFlDeVBGVlRwRkowb0Q2VXNSL0o5c3pjeWo4bXlHNnhPSWFvZ1ZNNGpoL21EQ3pwVUNobXUwZUxKUVRTd3cxQ1E9PQo=",
          url: "https://drive.google.com/uc?export=download&id=1B3Tm5pMF119IM4b6XjuZYCzm2SrgoFge",
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTJaQnl0Y0VjaUx1UmtyYkU0TDBNcEpYWDJrQjJmZSs4cWpNeHJFd01qZzdENW8xRm8ya2E3NU15d25vN2o5ODU5aTJvQUh2dFlramdqZzF1a01KMFFRPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYyMTg3NDE4CWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKQXpCYXdBTXZIMzZGRk1nS09Nc0dLeFlDeVBGVlRwRkowb0Q2VXNSL0o5c3pjeWo4bXlHNnhPSWFvZ1ZNNGpoL21EQ3pwVUNobXUwZUxKUVRTd3cxQ1E9PQo=",
          url: "https://drive.google.com/uc?export=download&id=1B3Tm5pMF119IM4b6XjuZYCzm2SrgoFge",
        },
      },
    };

    return NextResponse.json(updateResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check for updates" + (error as Error).message },
      { status: 500 }
    );
  }
}
