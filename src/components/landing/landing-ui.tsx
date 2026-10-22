import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LandingContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export function LandingContainer({
  as: Component = "div",
  className,
  children,
  ...props
}: LandingContainerProps) {
  return (
    <Component className={cn("sp-container", className)} {...props}>
      {children}
    </Component>
  );
}

export interface SectionTagProps extends React.HTMLAttributes<HTMLDivElement> {
  dot?: boolean;
}

export function SectionTag({
  className,
  children,
  dot = true,
  ...props
}: SectionTagProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium tracking-wide",
        "gradient-chip text-foreground/90 select-none shadow-xs",
        className,
      )}
      {...props}>
      {dot && (
        <span
          className="size-1.5 rounded-full bg-primary animate-pulse"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  as: Component = "h2",
  className,
  children,
  ...props
}: SectionHeadingProps) {
  return (
    <Component
      className={cn(
        "sp-section-title font-display font-light text-foreground tracking-tight",
        className,
      )}
      {...props}>
      {children}
    </Component>
  );
}

export type AccentButtonProps = React.ComponentProps<typeof Button>;

export function AccentButton({ className, ...props }: AccentButtonProps) {
  return (
    <Button
      className={cn(
        "gradient-brand-btn rounded-full font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
