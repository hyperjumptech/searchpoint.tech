import { describe, expect, it } from "vitest";
import { buildClientPayload, logoFileError } from "./page.helpers";

describe("MCP admin logo payload", () => {
  it("omits logo unless the caller passes a logo action", () => {
    expect(
      buildClientPayload({
        name: "A",
        redirectUri: "https://x.test/cb",
        scopes: ["search"],
      }),
    ).toEqual({
      name: "A",
      redirectUri: "https://x.test/cb",
      scopes: ["search"],
    });
  });
  it("includes set and clear logo fields", () => {
    expect(
      buildClientPayload(
        { name: "A", redirectUri: "https://x.test/cb", scopes: ["search"] },
        ["search"],
        { logoDataUrl: "data:image/png;base64,abc" },
      ),
    ).toMatchObject({ logoDataUrl: "data:image/png;base64,abc" });
    expect(
      buildClientPayload(
        { name: "A", redirectUri: "https://x.test/cb", scopes: ["search"] },
        ["search"],
        { logoDataUrl: null },
      ),
    ).toMatchObject({ logoDataUrl: null });
  });
  it("rejects files larger than 2MB", () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.png");
    expect(logoFileError(file)).toMatch(/2MB/);
    expect(logoFileError(new File(["x"], "x.png"))).toBeNull();
  });
});
