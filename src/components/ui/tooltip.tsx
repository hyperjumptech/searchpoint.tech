"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "center" | "left" | "right";
  disabled?: boolean;
  /** Position the tooltip relative to this element instead of the wrapper. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Extra classes applied to the tooltip card (merged over the default). */
  tooltipClassName?: string;
  /** Extra classes applied to the arrow (merge over the default border color). */
  arrowClassName?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const GAP = 10;

type R = DOMRect;

const POS: Record<
  string,
  (r: R) => { top: number; left: number; transform: string }
> = {
  "top-center": (r) => ({
    top: r.top - GAP,
    left: r.left + r.width / 2,
    transform: "translate(-50%, -100%)",
  }),
  "top-right": (r) => ({
    top: r.top - GAP,
    left: r.right,
    transform: "translate(-100%, -100%)",
  }),
  "top-left": (r) => ({
    top: r.top - GAP,
    left: r.left,
    transform: "translate(0, -100%)",
  }),
  "bottom-center": (r) => ({
    top: r.bottom + GAP,
    left: r.left + r.width / 2,
    transform: "translate(-50%, 0)",
  }),
  "bottom-right": (r) => ({
    top: r.bottom + GAP,
    left: r.right,
    transform: "translate(-100%, 0)",
  }),
  "bottom-left": (r) => ({
    top: r.bottom + GAP,
    left: r.left,
    transform: "translate(0, 0)",
  }),
  "left-center": (r) => ({
    top: r.top + r.height / 2,
    left: r.left - GAP,
    transform: "translate(-100%, -50%)",
  }),
  "left-right": (r) => ({
    top: r.bottom,
    left: r.left - GAP,
    transform: "translate(-100%, 0)",
  }),
  "left-left": (r) => ({
    top: r.top,
    left: r.left - GAP,
    transform: "translate(-100%, 0)",
  }),
  "right-center": (r) => ({
    top: r.top + r.height / 2,
    left: r.right + GAP,
    transform: "translate(0, -50%)",
  }),
  "right-right": (r) => ({
    top: r.bottom,
    left: r.right + GAP,
    transform: "translate(0, 0)",
  }),
  "right-left": (r) => ({
    top: r.top,
    left: r.right + GAP,
    transform: "translate(0, 0)",
  }),
};

const ARROW: Record<NonNullable<TooltipProps["position"]>, string> = {
  top: "absolute -bottom-[8px] left-1/2 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-slate-800",
  bottom:
    "absolute -top-[8px] left-1/2 -translate-x-1/2 border-x-[6px] border-b-[8px] border-x-transparent border-b-slate-800",
  left: "absolute -right-[8px] top-1/2 -translate-y-1/2 border-y-[6px] border-l-[8px] border-y-transparent border-l-slate-800",
  right:
    "absolute -left-[8px] top-1/2 -translate-y-1/2 border-y-[6px] border-r-[8px] border-y-transparent border-r-slate-800",
};

export function Tooltip({
  children,
  content,
  className,
  position = "bottom",
  align = "center",
  disabled = false,
  anchorRef,
  tooltipClassName,
  arrowClassName,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>();
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!visible || disabled) return;
    const el = anchorRef?.current ?? ref.current;
    if (!el) return;

    const updatePosition = () => {
      const r = el.getBoundingClientRect();
      const fn = POS[`${position}-${align}`];
      if (fn) setStyle({ position: "fixed", zIndex: 50, ...fn(r) });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, position, align, disabled, anchorRef]);

  return (
    <div
      ref={ref}
      className={cn("inline-flex items-center", className)}
      aria-label={typeof content === "string" ? content : undefined}
      onMouseEnter={() => !disabled && setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible &&
        !disabled &&
        style &&
        createPortal(
          <span
            role="tooltip"
            className={cn(
              "pointer-events-none rounded bg-slate-800 px-2 py-1 text-xs font-medium leading-snug text-white shadow",
              tooltipClassName,
            )}
            style={style}>
            <span aria-hidden className={cn(ARROW[position], arrowClassName)} />
            {content}
          </span>,
          document.body,
        )}
    </div>
  );
}
