"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  Copy,
  Edit3,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  buildClientPayload,
  formatDateTime,
  getApiError,
  replaceClient,
  validateRedirectUri,
} from "./page.helpers";

export type McpClient = {
  clientId: string;
  name: string;
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string | null;
};
type FormMode = { kind: "create" } | { kind: "edit"; client: McpClient };
const empty = { name: "", redirectUri: "", scopes: ["search"] };
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin" });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(getApiError(response, body));
  return body as T;
}

export function McpAdminClient() {
  const [clients, setClients] = useState<McpClient[]>([]),
    [allowedScopes, setAllowedScopes] = useState<string[]>(["search"]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState("");
  const [mode, setMode] = useState<FormMode | null>(null),
    [values, setValues] = useState(empty),
    [formError, setFormError] = useState(""),
    [saving, setSaving] = useState(false),
    [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
      kind: "revoke" | "rotate";
      client: McpClient;
    } | null>(null),
    [secret, setSecret] = useState<{ clientId: string; value: string } | null>(
      null,
    );
  useEffect(() => {
    requestJson<{ clients: McpClient[]; allowedScopes?: string[] }>(
      "/api/admin/mcp/clients",
    )
      .then((r) => {
        setClients(r.clients);
        const scopes = r.allowedScopes?.filter(Boolean) ?? ["search"];
        setAllowedScopes(scopes);
      })
      .catch((e) =>
        setLoadError(
          e instanceof Error ? e.message : "Unable to load OAuth clients.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const openCreate = () => {
    setMode({ kind: "create" });
    setValues({
      ...empty,
      scopes: allowedScopes.includes("search")
        ? ["search"]
        : allowedScopes.slice(0, 1),
    });
    setFormError("");
  };
  const openEdit = (client: McpClient) => {
    setMode({ kind: "edit", client });
    setValues({
      name: client.name,
      redirectUri: client.redirectUri,
      scopes: client.scopes ?? ["search"],
    });
    setFormError("");
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mode || saving) return;
    const uriError = validateRedirectUri(values.redirectUri);
    if (uriError) return setFormError(uriError);
    setSaving(true);
    try {
      const result = await requestJson<{
        client: McpClient;
        clientSecret?: string;
      }>(
        mode.kind === "create"
          ? "/api/admin/mcp/clients"
          : `/api/admin/mcp/clients/${encodeURIComponent(mode.client.clientId)}`,
        {
          method: mode.kind === "create" ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(buildClientPayload(values, allowedScopes)),
        },
      );
      setClients((current) =>
        mode.kind === "create"
          ? [...current, result.client]
          : replaceClient(current, result.client),
      );
      setMode(null);
      if (result.clientSecret)
        setSecret({
          clientId: result.client.clientId,
          value: result.clientSecret,
        });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unable to save client.");
    } finally {
      setSaving(false);
    }
  };
  const action = async (
    client: McpClient,
    kind: "toggle" | "revoke" | "rotate",
  ) => {
    setBusy(client.clientId);
    setError("");
    try {
      if (kind === "revoke") {
        const r = await requestJson<{ client: McpClient }>(
          `/api/admin/mcp/clients/${encodeURIComponent(client.clientId)}`,
          { method: "DELETE" },
        );
        setClients((x) => replaceClient(x, r.client));
      } else if (kind === "rotate") {
        const r = await requestJson<{ clientSecret: string }>(
          `/api/admin/mcp/clients/${encodeURIComponent(client.clientId)}/rotate-secret`,
          { method: "POST" },
        );
        setSecret({ clientId: client.clientId, value: r.clientSecret });
      } else {
        const r = await requestJson<{ client: McpClient }>(
          `/api/admin/mcp/clients/${encodeURIComponent(client.clientId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ enabled: !client.enabled }),
          },
        );
        setClients((x) => replaceClient(x, r.client));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update client.");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-end justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[.2em] text-slate-500">
              Control plane / MCP
            </p>
            <h1 className="text-3xl font-bold">OAuth clients</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Create static credentials for MCP integrations. Client secrets are
              shown only once.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus /> Add OAuth client
          </Button>
        </header>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto animate-spin" /> Loading OAuth
            clients...
          </div>
        ) : loadError ? (
          <div role="alert" className="p-12 text-center">
            {loadError}
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded border border-dashed p-12 text-center">
            <h2 className="font-semibold">No OAuth clients yet</h2>
            <Button variant="outline" onClick={openCreate} className="mt-4">
              <Plus /> Add first client
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded border bg-white dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Redirect URI</th>
                  <th className="px-4 py-3">Scopes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr
                    key={client.clientId}
                    className={client.revoked ? "opacity-60" : ""}>
                    <td className="px-4 py-4">
                      <div className="font-semibold">{client.name}</div>
                      <code className="text-xs text-slate-500">
                        {client.clientId}
                      </code>
                    </td>
                    <td className="max-w-xs break-all px-4 py-4 text-xs">
                      {client.redirectUri}
                    </td>
                    <td className="px-4 py-4">{client.scopes.join(", ")}</td>
                    <td className="px-4 py-4">
                      {client.revoked
                        ? "Revoked"
                        : client.enabled
                          ? "Enabled"
                          : "Disabled"}
                      <div className="text-xs text-slate-500">
                        {formatDateTime(client.updatedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`${client.enabled ? "Disable" : "Enable"} ${client.name}`}
                          disabled={!!busy || client.revoked}
                          onClick={() => action(client, "toggle")}>
                          <Power />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${client.name}`}
                          disabled={!!busy || client.revoked}
                          onClick={() => openEdit(client)}>
                          <Edit3 />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Rotate secret for ${client.name}`}
                          disabled={!!busy || client.revoked}
                          onClick={() =>
                            setConfirm({ kind: "rotate", client })
                          }>
                          <RefreshCw />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Revoke ${client.name}`}
                          disabled={!!busy || client.revoked}
                          onClick={() =>
                            setConfirm({ kind: "revoke", client })
                          }>
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => !open && !saving && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode?.kind === "edit"
                ? "Edit OAuth client"
                : "Create OAuth client"}
            </DialogTitle>
            <DialogDescription>
              Choose a name, one redirect URI, and the scopes this client may
              request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Name
              <Input
                aria-label="Name"
                required
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Redirect URI
              <Input
                aria-label="Redirect URI"
                required
                value={values.redirectUri}
                onChange={(e) =>
                  setValues({ ...values, redirectUri: e.target.value })
                }
              />
            </label>
            <fieldset>
              <legend className="text-sm font-medium">Scopes</legend>
              {allowedScopes.map((scope) => (
                <label key={scope} className="mt-2 flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    aria-label={`Scope ${scope}`}
                    checked={values.scopes.includes(scope)}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        scopes: e.target.checked
                          ? [...values.scopes, scope]
                          : values.scopes.filter((s) => s !== scope),
                      })
                    }
                  />{" "}
                  {scope}
                </label>
              ))}
            </fieldset>
            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !values.name.trim() ||
                  !values.redirectUri.trim() ||
                  !values.scopes.length
                }>
                {saving
                  ? "Saving..."
                  : mode?.kind === "edit"
                    ? "Save changes"
                    : "Create client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "revoke"
                ? "Revoke OAuth client?"
                : "Rotate client secret?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "revoke"
                ? "This immediately invalidates the client and all its credentials. This cannot be undone."
                : "The current secret is immediately invalidated. The new secret will be shown once and cannot be recovered."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.kind === "revoke" ? "destructive" : "default"}
              onClick={() => confirm && action(confirm.client, confirm.kind)}>
              {confirm?.kind === "revoke" ? "Revoke client" : "Rotate secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={secret !== null}
        onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save these credentials now</DialogTitle>
            <DialogDescription>
              This secret is shown once. Store it securely before closing this
              dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Client ID
              <Input readOnly value={secret?.clientId ?? ""} />
            </label>
            <label className="block text-sm font-medium">
              Client secret
              <Input readOnly value={secret?.value ?? ""} />
            </label>
            <Button
              onClick={() =>
                secret &&
                navigator.clipboard?.writeText(
                  `${secret.clientId}:${secret.value}`,
                )
              }>
              <Copy /> Copy credentials
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>I saved the secret</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
