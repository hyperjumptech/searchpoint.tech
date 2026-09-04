const SCOPE_LABELS: Record<string, { label: string; show: boolean }> = {
  openid: { label: "Lihat identitas akun kamu (OpenID)", show: false },
  profile: { label: "Lihat profil kamu (nama, avatar)", show: true },
  email: { label: "Lihat alamat email kamu", show: true },
  search: { label: "Cari dokumen di akun kamu", show: true },
  magic: { label: "Masuk lewat magic link", show: false },
};

export function describeScopes(scope: string): {
  visible: string[];
  unknown: string[];
} {
  const parts = scope.split(/[\s,]+/).filter(Boolean);
  const visible: string[] = [];
  const unknown: string[] = [];
  for (const s of parts) {
    const meta = SCOPE_LABELS[s];
    if (meta?.show) visible.push(meta.label);
    else if (s === "openid") continue;
    else if (!meta) unknown.push(s);
  }
  return { visible, unknown };
}
