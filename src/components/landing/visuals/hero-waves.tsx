"use client";

import * as React from "react";

interface StrandConfig {
  amp: number;
  freq: number;
  phase: number;
  speed: number;
  opacity: number;
}

const STRANDS: StrandConfig[] = [
  { amp: 179, freq: 2.9, phase: 0, speed: 0.29, opacity: 0.85 },
  { amp: 152, freq: 3.3, phase: 1.1, speed: -0.34, opacity: 0.7 },
  { amp: 165, freq: 2.6, phase: 2.3, speed: 0.22, opacity: 0.6 },
  { amp: 130, freq: 3.6, phase: 3.4, speed: -0.26, opacity: 0.55 },
  { amp: 185, freq: 2.3, phase: 4.6, speed: 0.38, opacity: 0.45 },
  { amp: 117, freq: 4.0, phase: 5.5, speed: -0.19, opacity: 0.4 },
];

const HARMONICS = [
  { weight: 0.55, freqMul: 1, speedMul: 1 },
  { weight: 0.3, freqMul: 2.31, speedMul: -1.7 },
  { weight: 0.15, freqMul: 4.13, speedMul: 2.6 },
];

function computeStrandPath(strand: StrandConfig, t: number): string {
  let d = "";
  for (let n = 0; n <= 240; n++) {
    const x = 150 + 3.6791666666666667 * n;
    const dist = 1033 - x;
    const s_d = Math.pow(Math.min(dist / 478, 1), 0.9);
    const a_d = Math.min(dist / 120, 1);
    let val = 0;
    for (let i = 0; i < HARMONICS.length; i++) {
      const h = HARMONICS[i];
      val +=
        h.weight *
        Math.sin(
          (strand.freq * h.freqMul * dist) / 100 +
            strand.phase * (i + 1) +
            strand.speed * h.speedMul * t,
        );
    }
    const y = 195.5 + strand.amp * (a_d * a_d * (3 - 2 * a_d) * s_d) * val;
    d += `${n === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function HeroWaves({ className }: { className?: string }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Static initial frame
    STRANDS.forEach((strand, i) => {
      const el = pathRefs.current[i];
      if (el) {
        el.setAttribute("d", computeStrandPath(strand, 0));
      }
    });

    if (reducedMotion) return;

    let rafId = 0;
    let isIntersecting = true;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      for (let i = 0; i < STRANDS.length; i++) {
        const el = pathRefs.current[i];
        if (el) {
          el.setAttribute("d", computeStrandPath(STRANDS[i], elapsed));
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(rafId);
      if (isIntersecting && !document.hidden) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      start();
    });
    io.observe(svg);

    const handleVisibility = () => {
      start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    start();

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={
        className ||
        "hero-waves-svg absolute top-[calc(50%-195.5px)] left-1/2 -translate-x-[1183px] opacity-80 md:-translate-x-[1285px]"
      }
      width="1138.64"
      height="390"
      viewBox="0 0 1138.64 390"
      fill="none"
      overflow="visible"
      aria-hidden="true">
      <defs>
        <linearGradient
          id="sp-hero-wave"
          x1="0"
          y1="0"
          x2="1033"
          y2="0"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.52" />
          <stop offset="0.92" stopColor="currentColor" stopOpacity="0.52" />
          <stop offset="1" stopColor="var(--sp-accent)" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient
          id="sp-hero-wave-line"
          x1="1033"
          y1="0"
          x2="1138"
          y2="0"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--sp-accent)" stopOpacity="0.52" />
          <stop offset="0.4" stopColor="currentColor" stopOpacity="0.42" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {STRANDS.map((strand, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d="M150 195L1033 195"
          pathLength={1}
          className="nx-wave-strand"
          stroke="url(#sp-hero-wave)"
          strokeWidth="1"
          strokeOpacity={strand.opacity}
          fill="none"
        />
      ))}
      <line
        className="nx-wave-run hidden md:block"
        x1="1033"
        y1="195.5"
        x2="1138"
        y2="195.5"
        stroke="url(#sp-hero-wave-line)"
        strokeWidth="1"
      />
    </svg>
  );
}
