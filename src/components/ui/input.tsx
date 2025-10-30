import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex items-center w-full rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          className
        )}
      >
        {leftIcon && (
          <span className="ml-2 text-muted-foreground flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
            "h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-base md:text-sm outline-none border-none",
            leftIcon && "pl-2"
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
