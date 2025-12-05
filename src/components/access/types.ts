export type TAccessFilter = {
  access:
    | "public"
    | "private-full-access"
    | "private-restricted"
    | "private-forbidden"
    | "personal-restricted"
    | "personal-forbidden";
  count: number;
};

export const accessLabels: Record<TAccessFilter["access"], string> = {
  public: "Public",
  "private-full-access": "Private: Full Access",
  "private-restricted": "Private: Restricted",
  "private-forbidden": "Private: Forbidden",
  "personal-restricted": "Personal: Restricted",
  "personal-forbidden": "Personal: Forbidden",
};

export const accessTooltips: Record<TAccessFilter["access"], string> = {
  public: "Anyone with the link can access this file.",
  "private-full-access": "You own this file and have complete control.",
  "private-restricted":
    "Someone shared this file with you. You can access based on the permissions they've set.",
  "private-forbidden":
    "This file exists but hasn't been shared with you. Contact the owner to request access.",
  "personal-restricted":
    "This file is in your Shared Folder. You and people with access to your folder can access it.",
  "personal-forbidden":
    "This file is in another person's Shared Folder. You don't have access to their folder.",
};
