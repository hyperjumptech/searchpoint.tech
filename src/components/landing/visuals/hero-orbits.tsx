"use client";

import * as React from "react";

interface RailConfig {
  id: string;
  d: string;
  seed: number;
  dur: number;
  fill: string;
}

const RAILS: RailConfig[] = [
  {
    id: "nx-rail-1",
    d: "M129.945 53.58 A461.34 53.08 0 0 1 1052.63 53.58",
    seed: 278.9,
    dur: 17,
    fill: "var(--sp-accent)",
  },
  {
    id: "nx-rail-2",
    d: "M129.945 53.58 A461.34 31.17 0 0 1 1052.63 53.58",
    seed: 350.463,
    dur: 21,
    fill: "#ffffff",
  },
  {
    id: "nx-rail-3",
    d: "M129.945 53.58 A461.34 31.17 0 0 0 1052.63 53.58",
    seed: 233.963,
    dur: 19,
    fill: "var(--sp-accent)",
  },
  {
    id: "nx-rail-4",
    d: "M129.945 53.58 A461.34 53.08 0 0 0 1052.63 53.58",
    seed: 444.205,
    dur: 24,
    fill: "#ffffff",
  },
  {
    id: "nx-rail-5",
    d: "M0 53.08 L593.172 53.08",
    seed: 506.92,
    dur: 13,
    fill: "var(--sp-accent)",
  },
];

export function HeroOrbits({ className }: { className?: string }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const railRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = React.useRef<(SVGCircleElement | null)[]>([]);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lengths: number[] = [];
    const initialFractions: number[] = [];

    // Measure path lengths and calculate initial positions based on seeds
    RAILS.forEach((rail, idx) => {
      const path = railRefs.current[idx];
      if (!path) {
        lengths[idx] = 0;
        initialFractions[idx] = 0;
        return;
      }
      const len = path.getTotalLength();
      lengths[idx] = len;

      let low = 0;
      let high = len;
      for (let e = 0; e < 24; e++) {
        const mid = (low + high) / 2;
        if (path.getPointAtLength(mid).x < rail.seed) {
          low = mid;
        } else {
          high = mid;
        }
      }
      initialFractions[idx] = len > 0 ? low / len : 0;
    });

    const setDotPosition = (idx: number, frac: number) => {
      const path = railRefs.current[idx];
      const dot = dotRefs.current[idx];
      const len = lengths[idx];
      if (!path || !dot || !len) return;

      const norm = ((frac % 1) + 1) % 1;
      const pt = path.getPointAtLength(norm * len);
      dot.setAttribute("cx", pt.x.toFixed(2));
      dot.setAttribute("cy", pt.y.toFixed(2));
    };

    // Set static initial frame
    RAILS.forEach((_, idx) => setDotPosition(idx, initialFractions[idx]));

    if (reducedMotion) return;

    let rafId = 0;
    let isIntersecting = true;
    const t0 = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - t0) / 1000;
      RAILS.forEach((rail, idx) => {
        setDotPosition(idx, initialFractions[idx] + elapsed / rail.dur);
      });
      rafId = requestAnimationFrame(animate);
    };

    const start = () => {
      cancelAnimationFrame(rafId);
      if (isIntersecting && !document.hidden) {
        rafId = requestAnimationFrame(animate);
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
        "nx-orbit-svg absolute top-[calc(50%-53.5px)] left-1/2 translate-x-[20px] md:translate-x-[145px]"
      }
      width="1053.13"
      height="107.159"
      viewBox="0 0 1053.13 107.159"
      fill="none"
      overflow="visible"
      aria-hidden="true">
      <defs>
        <linearGradient
          id="sp-orbit-outer"
          x1="129.445"
          y1="53.5796"
          x2="1053.13"
          y2="53.5796"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="1" stopColor="var(--sp-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="sp-orbit-inner"
          x1="129.445"
          y1="53.5796"
          x2="1053.13"
          y2="53.5796"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--sp-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <line
        x1="0"
        y1="53.0791"
        x2="593.172"
        y2="53.0792"
        stroke="currentColor"
        strokeOpacity="0.2"
        className="nx-orbit-el"
      />

      {/* Outer Orbit Path */}
      <path
        d="M591.288 0.5C718.809 0.5 834.25 6.49629 917.803 16.1895C959.582 21.0364 993.371 26.8059 1016.71 33.2061C1028.38 36.4072 1037.4 39.7592 1043.5 43.2168C1046.55 44.9457 1048.84 46.6874 1050.37 48.4307C1051.89 50.1707 1052.63 51.8865 1052.63 53.5801C1052.63 55.2735 1051.89 56.9886 1050.37 58.7285C1048.84 60.4717 1046.55 62.2135 1043.5 63.9424C1037.4 67.3999 1028.38 70.752 1016.71 73.9531C993.371 80.3533 959.582 86.1228 917.803 90.9697C834.25 100.663 718.809 106.659 591.288 106.659C463.767 106.659 348.326 100.663 264.773 90.9697C222.994 86.1228 189.205 80.3533 165.871 73.9531C154.2 70.752 145.174 67.3999 139.075 63.9424C136.026 62.2135 133.732 60.4717 132.206 58.7285C130.683 56.9886 129.945 55.2735 129.945 53.5801C129.945 51.8865 130.683 50.1707 132.206 48.4307C133.732 46.6874 136.026 44.9457 139.075 43.2168C145.174 39.7592 154.2 36.4072 165.871 33.2061C189.205 26.8059 222.994 21.0364 264.773 16.1895C348.326 6.49629 463.767 0.5 591.288 0.5Z"
        stroke="url(#sp-orbit-outer)"
        className="nx-orbit-el"
      />

      {/* Inner Orbit Path */}
      <path
        d="M591.288 22.4072C718.815 22.4072 834.264 25.952 917.826 31.6826C959.61 34.548 993.409 37.9596 1016.76 41.7451C1028.43 43.6385 1037.48 45.6222 1043.59 47.6709C1046.65 48.6964 1048.95 49.7284 1050.47 50.7559C1052.01 51.7986 1052.63 52.7488 1052.63 53.5801C1052.63 54.4112 1052.01 55.3608 1050.47 56.4033C1048.95 57.4308 1046.65 58.4628 1043.59 59.4883C1037.48 61.537 1028.43 63.5207 1016.76 65.4141C993.409 69.1996 959.61 72.6111 917.826 75.4766C834.264 81.2071 718.815 84.752 591.288 84.752C463.761 84.752 348.312 81.2071 264.75 75.4766C222.967 72.6111 189.167 69.1996 165.819 65.4141C154.142 63.5207 145.1 61.537 138.987 59.4883C135.927 58.4628 133.631 57.4308 132.109 56.4033C130.566 55.3608 129.946 54.4112 129.945 53.5801C129.945 52.7488 130.565 51.7986 132.109 50.7559C133.631 49.7284 135.927 48.6964 138.987 47.6709C145.1 45.6222 154.142 43.6385 165.819 41.7451C189.167 37.9596 222.967 34.548 264.75 31.6826C348.312 25.952 463.761 22.4072 591.288 22.4072Z"
        stroke="url(#sp-orbit-inner)"
        className="nx-orbit-el"
      />

      {/* Hidden Guide Rails */}
      {RAILS.map((rail, idx) => (
        <path
          key={rail.id}
          ref={(el) => {
            railRefs.current[idx] = el;
          }}
          data-rail={idx}
          d={rail.d}
          fill="none"
          stroke="none"
        />
      ))}

      {/* Traveling Dots */}
      {RAILS.map((rail, idx) => (
        <circle
          key={`dot-${idx}`}
          ref={(el) => {
            dotRefs.current[idx] = el;
          }}
          className="nx-orbit-dot"
          r="2.4"
          fill={rail.fill}
        />
      ))}
    </svg>
  );
}
