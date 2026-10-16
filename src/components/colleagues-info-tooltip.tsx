"use client";

import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export const COLLEAGUES_TOOLTIP_TEXT =
  "Colleagues are members of your organization who share the same email domain.";

export interface ColleaguesInfoTooltipProps {
  className?: string;
  iconClassName?: string;
}

export function ColleaguesInfoTooltip({
  className,
  iconClassName = "h-3.5 w-3.5",
}: ColleaguesInfoTooltipProps) {
  return (
    <Tooltip
      content={COLLEAGUES_TOOLTIP_TEXT}
      position="top"
      tooltipClassName="!z-[60] max-w-[240px] text-center">
      <span
        data-testid="colleagues-info-icon"
        className={
          className ??
          "inline-flex h-4 w-4 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-help"
        }>
        <Info className={iconClassName} />
      </span>
    </Tooltip>
  );
}
