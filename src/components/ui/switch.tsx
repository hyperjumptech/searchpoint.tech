import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = {
  /** Whether the switch is on. */
  checked: boolean;
  /** Called when the user toggles the switch. */
  onCheckedChange: (checked: boolean) => void;
  /** When true, the switch is disabled. */
  disabled?: boolean;
  /** Accessible name for the switch (required when no visible label). */
  "aria-label"?: string;
  /** Optional className for the root element. */
  className?: string;
  /** Optional visible label (e.g. text next to the switch). */
  children?: React.ReactNode;
  /** Optional test id for the control. */
  "data-testid"?: string;
};

/**
 * Accessible toggle switch.
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      "aria-label": ariaLabel,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "flex shrink-0 items-center gap-2 text-left text-sm font-medium text-foreground cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...rest}>
        <span
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
            checked ? "bg-primary" : "bg-input",
          )}>
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-primary-foreground shadow ring-0 transition-transform duration-200",
              checked
                ? "translate-x-[22px] translate-y-0.5"
                : "translate-x-0.5 translate-y-0.5",
            )}
          />
        </span>
        {children != null && <span>{children}</span>}
      </button>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
