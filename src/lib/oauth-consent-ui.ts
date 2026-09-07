const SCOPE_LABELS: Record<string, { label: string; show: boolean }> = {
  openid: { label: "View your identity (OpenID)", show: false },
  profile: { label: "View your profile (name, avatar)", show: true },
  email: { label: "View your email address", show: true },
  search: { label: "Search documents in your account", show: true },
  magic: { label: "Sign in with a magic link", show: false },
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
