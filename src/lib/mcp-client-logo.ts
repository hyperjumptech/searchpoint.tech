export const MAX_LOGO_DATA_URL_LENGTH = 20_000;
export const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

export function validateLogoDataUrl(value: string): void {
  if (
    !value.startsWith(PNG_DATA_URL_PREFIX) ||
    value.length > MAX_LOGO_DATA_URL_LENGTH
  ) {
    throw new Error("invalid logo");
  }
  const b64 = value.slice(PNG_DATA_URL_PREFIX.length);
  const buf = Buffer.from(b64, "base64");
  if (
    !buf.length ||
    buf[0] !== 0x89 ||
    buf[1] !== 0x50 ||
    buf[2] !== 0x4e ||
    buf[3] !== 0x47
  ) {
    throw new Error("invalid logo");
  }
}

export function clientInitial(name: string): string {
  const ch = Array.from(name.trim())[0];
  if (!ch) return "?";
  return ch.toUpperCase();
}
