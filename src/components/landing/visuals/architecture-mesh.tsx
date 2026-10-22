"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export default function ArchitectureMesh() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = containerRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let isRunning = false;
    let startedAt = 0;

    const getPrimaryRgb = () => {
      try {
        const css =
          getComputedStyle(wrap).getPropertyValue("--sp-accent").trim() ||
          getComputedStyle(wrap).getPropertyValue("--primary").trim() ||
          "currentColor";
        const probe = document.createElement("canvas");
        probe.width = 1;
        probe.height = 1;
        const pctx = probe.getContext("2d");
        if (!pctx) return "37, 99, 235";
        pctx.fillStyle = css;
        pctx.fillRect(0, 0, 1, 1);
        const data = pctx.getImageData(0, 0, 1, 1).data;
        return `${data[0]}, ${data[1]}, ${data[2]}`;
      } catch {
        return "37, 99, 235";
      }
    };

    let brandRgb = getPrimaryRgb();

    const draw = (t: number) => {
      if (!width || !height) return;

      const isLight =
        document.documentElement.getAttribute("data-theme") === "light" ||
        resolvedTheme === "light";

      const lineRgb = isLight ? "15, 23, 42" : "255, 255, 255";
      const backAlpha = isLight ? 0.085 : 0.1;
      const frontAlpha = isLight ? 0.26 : 0.3;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const scale = Math.min(width, height) * 0.34;
      const rotY = 0.6 + t * 0.2;
      const tilt = 0.4;
      const twist = 0.95 + 0.5 * Math.sin(t * 0.35);
      const ripple = 0.055 * Math.sin(t * 1.2);
      const persp = 4.6;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(tilt);
      const sinX = Math.sin(tilt);

      const project = (
        x: number,
        y: number,
        z: number,
      ): [number, number, number] => {
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const k = persp / (persp - z2);
        return [cx + x1 * k * scale, cy + y1 * k * scale, z2];
      };

      const point = (u: number, v: number): [number, number, number] => {
        const tu = u + twist * v;
        const spread = 1.42 * v;
        const breath = 1 + ripple * Math.sin(v * 4.4 - t * 1.4);
        const radius = 0.64 * Math.sqrt(1 + spread * spread) * breath;
        return [radius * Math.cos(tu), v * 1.04, radius * Math.sin(tu)];
      };

      const back = new Path2D();
      const front = new Path2D();
      const scan = new Path2D();

      const scanPhase = (t * 0.14) % 1;
      const scanV =
        -1 + 2 * (scanPhase < 0.5 ? scanPhase * 2 : (1 - scanPhase) * 2);

      const segment = (
        a: [number, number, number],
        b: [number, number, number],
        isScan: boolean,
      ) => {
        const path = (a[2] + b[2]) * 0.5 >= 0 ? front : back;
        path.moveTo(a[0], a[1]);
        path.lineTo(b[0], b[1]);
        if (isScan) {
          scan.moveTo(a[0], a[1]);
          scan.lineTo(b[0], b[1]);
        }
      };

      const rings = 32;
      const ringSegments = 96;
      for (let i = 0; i <= rings; i++) {
        const v = -1 + (2 * i) / rings;
        const isScan = Math.abs(v - scanV) < 0.05;
        let prev: [number, number, number] | null = null;
        for (let j = 0; j <= ringSegments; j++) {
          const u = (j / ringSegments) * TAU;
          const p = point(u, v);
          const proj = project(p[0], p[1], p[2]);
          if (prev) segment(prev, proj, isScan);
          prev = proj;
        }
      }

      const meridians = 54;
      const meridianSegments = 22;
      for (let j = 0; j < meridians; j++) {
        const u = (j / meridians) * TAU;
        let prev: [number, number, number] | null = null;
        for (let i = 0; i <= meridianSegments; i++) {
          const v = -1 + (2 * i) / meridianSegments;
          const p = point(u, v);
          const proj = project(p[0], p[1], p[2]);
          if (prev) segment(prev, proj, false);
          prev = proj;
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "butt";
      ctx.lineJoin = "round";

      ctx.strokeStyle = `rgba(${lineRgb}, ${backAlpha})`;
      ctx.lineWidth = 0.7;
      ctx.stroke(back);

      ctx.strokeStyle = `rgba(${lineRgb}, ${frontAlpha})`;
      ctx.lineWidth = 0.85;
      ctx.stroke(front);

      ctx.strokeStyle = `rgba(${brandRgb}, 0.55)`;
      ctx.lineWidth = 1.15;
      ctx.stroke(scan);
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      brandRgb = getPrimaryRgb();
      if (!isRunning) {
        draw(
          reduceMotionQuery.matches
            ? 1.4
            : startedAt
              ? (performance.now() - startedAt) / 1000
              : 0,
        );
      }
    };

    const frame = (now: number) => {
      if (!isRunning) return;
      draw((now - startedAt) / 1000);
      rafId = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (isRunning || reduceMotionQuery.matches) return;
      isRunning = true;
      if (!startedAt) startedAt = performance.now();
      rafId = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      isRunning = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    resize();

    // Intersection observer
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              start();
            } else {
              stop();
            }
          });
        },
        { threshold: 0.02 },
      );
      io.observe(wrap);
    } else {
      start();
    }

    // Resize observer
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(wrap);
    } else {
      window.addEventListener("resize", resize);
    }

    return () => {
      stop();
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [resolvedTheme]);

  return (
    <div ref={containerRef} className="arch-mesh" aria-hidden="true">
      <canvas ref={canvasRef} id="arch-mesh-canvas" />
    </div>
  );
}
