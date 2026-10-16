"use client";

import { useState, useEffect, useRef } from "react";
import { OneDriveIcon } from "@/components/icons/source-icons";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updatePreferences,
  fetchColleagues,
  inviteColleagues,
  type Colleague,
} from "@/actions/onedrive-settings";
import { ColleaguesInfoTooltip } from "@/components/colleagues-info-tooltip";
import {
  Check,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  Shield,
  Search,
} from "lucide-react";

export interface OneDriveSettingsClientProps {
  email?: string;
  initialAutoGrantEnabled: boolean;
}

export function OneDriveSettingsClient({
  email,
  initialAutoGrantEnabled,
}: OneDriveSettingsClientProps) {
  const [isEnabled, setIsEnabled] = useState(initialAutoGrantEnabled);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoadingColleagues, setIsLoadingColleagues] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleToggle = async (next: boolean) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      const res = await updatePreferences({ auto_grant_enabled: next });
      if (res.success) {
        setIsEnabled(next);
        setStatusMessage({
          text: next
            ? "Automatic search access enabled. Colleagues can now find files they already have access to."
            : "Automatic search access disabled. Colleagues can no longer find your files through search.",
          type: "success",
        });
      } else {
        setStatusMessage({
          text: res.error || "Failed to update preference",
          type: "error",
        });
      }
    } catch {
      setStatusMessage({
        text: "An error occurred while updating settings",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const inviteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allColleaguesRef = useRef<Map<string, Colleague>>(new Map());

  // Clean up invite timeout on unmount
  useEffect(() => {
    return () => {
      if (inviteTimerRef.current) {
        clearTimeout(inviteTimerRef.current);
      }
    };
  }, []);

  const prevQueryRef = useRef("");

  // Load colleagues when invite modal opens
  useEffect(() => {
    if (!isInviteOpen) {
      setQuery("");
      setSelectedEmails([]);
      setValidationError(null);
      setInviteSuccessMsg(null);
      setShowDropdown(false);
      prevQueryRef.current = "";
      allColleaguesRef.current.clear();
      return;
    }

    let active = true;
    setIsLoadingColleagues(true);
    fetchColleagues()
      .then((data) => {
        if (active) {
          setColleagues(data);
          data.forEach((c) => {
            allColleaguesRef.current.set(c.email.toLowerCase(), c);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load colleagues", err);
      })
      .finally(() => {
        if (active) setIsLoadingColleagues(false);
      });

    return () => {
      active = false;
    };
  }, [isInviteOpen]);

  // Debounced search when query changes
  useEffect(() => {
    if (!isInviteOpen) return;

    // Do not run on initial open when query has not changed from empty
    if (query === prevQueryRef.current) return;

    let active = true;
    const timer = setTimeout(() => {
      setIsLoadingColleagues(true);
      fetchColleagues(query.trim())
        .then((data) => {
          if (active) {
            setColleagues(data);
            data.forEach((c) => {
              allColleaguesRef.current.set(c.email.toLowerCase(), c);
            });
            prevQueryRef.current = query;
          }
        })
        .catch((err) => {
          console.error("Failed to search colleagues", err);
        })
        .finally(() => {
          if (active) setIsLoadingColleagues(false);
        });
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, isInviteOpen]);

  const addRecipient = (emailToAdd: string) => {
    const cleanEmail = emailToAdd.trim().toLowerCase();
    if (!cleanEmail) return;

    if (selectedEmails.includes(cleanEmail)) {
      setQuery("");
      setShowDropdown(false);
      return;
    }

    // Strict validation: check against active query result or any colleague retrieved in this session
    const isRegistered =
      colleagues.some((c) => c.email.toLowerCase() === cleanEmail) ||
      allColleaguesRef.current.has(cleanEmail);

    if (!isRegistered) {
      setValidationError(
        `"${cleanEmail}" is not a registered SearchPoint user. Only registered company colleagues can be invited.`,
      );
      return;
    }

    setSelectedEmails((prev) => [...prev, cleanEmail]);
    setQuery("");
    setValidationError(null);
    setShowDropdown(false);
  };

  const removeRecipient = (emailToRemove: string) => {
    setSelectedEmails((prev) => prev.filter((e) => e !== emailToRemove));
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (query.trim()) {
        addRecipient(query);
      }
    } else if (e.key === "Backspace" && !query && selectedEmails.length > 0) {
      removeRecipient(selectedEmails[selectedEmails.length - 1]);
    } else if (e.key === "Escape" && showDropdown) {
      e.stopPropagation();
      setShowDropdown(false);
    } else if (e.key === "ArrowDown" && !showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleSend = async () => {
    if (selectedEmails.length === 0 || isSending) return;

    setIsSending(true);
    setValidationError(null);
    try {
      const res = await inviteColleagues(selectedEmails);
      if (res.success) {
        setInviteSuccessMsg(
          selectedEmails.length === 1
            ? `An invitation was sent to ${selectedEmails[0]}.`
            : `Invitations were sent to ${selectedEmails.length} colleagues.`,
        );
        setSelectedEmails([]);
        setQuery("");
        inviteTimerRef.current = setTimeout(() => {
          setIsInviteOpen(false);
          setInviteSuccessMsg(null);
        }, 1500);
      } else {
        setValidationError(res.error || "Failed to send invitations");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send invitations";
      setValidationError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const filteredDropdownColleagues = colleagues.filter(
    (c) =>
      !selectedEmails.includes(c.email.toLowerCase()) &&
      c.email.toLowerCase() !== email?.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header section with OneDrive icon & account email */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xs backdrop-blur-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0078d4]/10 dark:bg-[#0078d4]/20">
          <OneDriveIcon size={32} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            OneDrive Search Settings
          </h1>
          {email && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {email}
            </p>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
          role="status">
          {statusMessage.type === "success" ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main toggle card */}
      <div className="space-y-6">
        <div
          className={`flex items-center justify-between gap-4 rounded-xl border p-5 transition-colors ${
            isEnabled
              ? "border-blue-500/30 bg-blue-500/5 shadow-xs"
              : "border-border bg-card"
          }`}>
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-semibold text-foreground">
                Let colleagues find your files
              </h2>
              <ColleaguesInfoTooltip />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Only files they can already open. Your sharing settings do not
              change.
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
            aria-label="Let colleagues find your files"
          />
        </div>

        {/* Status preview hint */}
        <div className="flex items-center gap-2.5 px-1 text-sm text-muted-foreground">
          {isEnabled ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          )}
          <span>
            Colleagues see the file name, folder, and a short preview.
          </span>
        </div>

        {/* Invite colleagues card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-foreground">
                Invite colleagues to let others find their files
              </h3>
              <ColleaguesInfoTooltip />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Invite teammates to enable OneDrive search so company files can be
              found easily.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={() => setIsInviteOpen(true)}
            className="shrink-0 gap-2 self-start sm:self-auto">
            <UserPlus className="h-4 w-4" />
            <span>Invite colleagues</span>
          </Button>
        </div>

        {/* Privacy and Security guarantees */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Privacy &amp; Security Guarantees</span>
          </div>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Zero permission elevation:</strong> Only files
                colleagues already have direct or link permissions to access in
                OneDrive can ever appear in search results.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Sharing unchanged:</strong> SearchPoint does not change
                or create OneDrive sharing links on your behalf.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Snippets only:</strong> Colleagues only see search
                result snippets; full content remains secured in your
                company&apos;s Microsoft tenant.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent
          className="sm:max-w-[500px]"
          onEscapeKeyDown={(e) => {
            if (showDropdown) {
              e.preventDefault();
              setShowDropdown(false);
            }
          }}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <DialogTitle className="text-lg font-semibold">
                    Invite colleagues
                  </DialogTitle>
                  <ColleaguesInfoTooltip />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ask teammates to turn on OneDrive search access.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {inviteSuccessMsg ? (
            <div className="py-6 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 flex flex-col items-center gap-2">
              <Check className="h-8 w-8 text-emerald-600" />
              <span>{inviteSuccessMsg}</span>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div ref={containerRef} className="space-y-2">
                {/* Tag input container */}
                <div
                  className="flex min-h-10 w-full items-center rounded-xl border border-input bg-background px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary cursor-text"
                  onClick={() => {
                    inputRef.current?.focus();
                    setShowDropdown(true);
                  }}>
                  <div className="flex flex-wrap items-center gap-1.5 w-full">
                    {selectedEmails.map((colleagueEmail) => (
                      <span
                        key={colleagueEmail}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {colleagueEmail}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecipient(colleagueEmail);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                            }
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${colleagueEmail}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}

                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                        setValidationError(null);
                      }}
                      onClick={() => setShowDropdown(true)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        selectedEmails.length === 0
                          ? "Enter registered colleague's email..."
                          : "Add more..."
                      }
                      className="flex-1 min-w-[160px] bg-transparent text-sm py-0.5 outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Colleague Choices / Suggestions (rendered in-flow to never cover action buttons) */}
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xs animate-in fade-in-50">
                    {isLoadingColleagues ? (
                      <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading registered colleagues...
                      </div>
                    ) : filteredDropdownColleagues.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        {query
                          ? "No registered colleague found matching this email."
                          : "No other registered colleagues available."}
                      </div>
                    ) : (
                      filteredDropdownColleagues.map((c) => {
                        const isAlreadyActive = c.auto_grant_enabled;
                        const isRecentlyInvited =
                          c.status === "invited" && c.last_invited_at;

                        return (
                          <button
                            key={c.email}
                            type="button"
                            onClick={() => addRecipient(c.email)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                            <span className="font-medium">{c.email}</span>
                            <div className="flex items-center gap-2">
                              {isAlreadyActive ? (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <Check className="h-3 w-3" />
                                  Access On
                                </span>
                              ) : isRecentlyInvited ? (
                                <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  Invited recently
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Validation error message */}
              {validationError && (
                <div className="flex items-start gap-1.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Only registered company users will be sent an invitation email
                with an activation link.
              </p>

              {/* Action buttons */}
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isSending}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={selectedEmails.length === 0 || isSending}>
                  {isSending && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  <span>
                    {isSending
                      ? "Sending..."
                      : `Send Invite${selectedEmails.length > 1 ? "s" : ""}`}
                  </span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
