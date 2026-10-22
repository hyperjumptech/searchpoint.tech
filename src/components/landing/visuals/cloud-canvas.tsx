"use client";

import * as React from "react";
import { useTheme } from "next-themes";

const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uSky;
uniform vec3 uRim;
uniform vec3 uCore;
uniform float uOpacity;
uniform float uEven;
uniform float uScale;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float h = px.y / uRes.y;
  float unit = max(uRes.x, uRes.y);
  vec2 uv = px / unit * uScale;

  float t = uTime;
  vec2 rise = vec2(0.0, -t * 0.06);

  float ridge = fbm(vec2(px.x / unit * 2.0 + t * 0.01, 3.7));
  float lift = mix(-0.08, 0.28, smoothstep(0.35, 0.7, ridge));

  vec2 warp = vec2(fbm(uv + rise + vec2(0.0, t * 0.02)),
                   fbm(uv + rise + vec2(5.2, 1.3) - t * 0.015));
  float d = fbm(uv * 1.3 + rise + warp * 1.4);

  float band = mix(clamp(1.0 - h * 1.1 + lift, 0.0, 1.0), 0.5, uEven);
  float dens = smoothstep(0.35, 0.8, d * (0.55 + band));
  float fade = mix(1.0 - smoothstep(0.45 + lift, 0.9 + lift, h), 1.0, uEven);

  vec3 cloud = mix(uRim, uCore, smoothstep(0.5, 1.0, dens));
  fragColor = vec4(mix(uSky, cloud, dens * fade * uOpacity), 1.0);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Resolves any valid CSS color string (including oklch, hsl, rgb, hex) to [r, g, b] (0..1)
 */
function resolveCssColorRgb(
  colorString: string,
  fallback: [number, number, number] = [0.2, 0.4, 0.9],
): [number, number, number] {
  if (typeof document === "undefined") return fallback;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.fillStyle = colorString;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return [data[0] / 255, data[1] / 255, data[2] / 255];
  } catch {
    return fallback;
  }
}

interface CloudCanvasProps {
  className?: string;
  tone?: "night" | "light_hero";
}

export function CloudCanvas({
  className = "pointer-events-none block size-full absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]",
  tone = "night",
}: CloudCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { resolvedTheme, theme } = useTheme();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect reduced motion
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Obtain WebGL2 context
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uSky = gl.getUniformLocation(prog, "uSky");
    const uRim = gl.getUniformLocation(prog, "uRim");
    const uCore = gl.getUniformLocation(prog, "uCore");
    const uOpacity = gl.getUniformLocation(prog, "uOpacity");
    const uEven = gl.getUniformLocation(prog, "uEven");
    const uScale = gl.getUniformLocation(prog, "uScale");

    const isDark = (resolvedTheme || theme) !== "light";

    // Read tenant primary color dynamically from DOM
    const primaryCss =
      getComputedStyle(canvas).getPropertyValue("--primary").trim() ||
      "oklch(0.577 0.245 27.325)";
    const brandRgb = resolveCssColorRgb(primaryCss, [0.86, 0.15, 0.15]);

    // Calculate tone parameters blending tenant brand colors
    let sky: [number, number, number];
    let rim: [number, number, number];
    let core: [number, number, number];
    let opacity: number;
    let even: number;
    let scale: number;

    if (isDark) {
      sky = [0.04, 0.04, 0.05];
      rim = [
        Math.min(1, brandRgb[0] * 0.65 + 0.15),
        Math.min(1, brandRgb[1] * 0.65 + 0.1),
        Math.min(1, brandRgb[2] * 0.65 + 0.1),
      ];
      core = [brandRgb[0] * 0.35, brandRgb[1] * 0.35, brandRgb[2] * 0.35];
      opacity = 0.38;
      even = 0.0;
      scale = 3.2;
    } else {
      sky = [0.96, 0.97, 0.98];
      rim = [0.92, 0.88, 0.88];
      core = [0.85, 0.78, 0.78];
      opacity = 0.45;
      even = 0.0;
      scale = 3.2;
    }

    gl.uniform3fv(uSky, sky);
    gl.uniform3fv(uRim, rim);
    gl.uniform3fv(uCore, core);
    gl.uniform1f(uOpacity, opacity);
    gl.uniform1f(uEven, even);
    gl.uniform1f(uScale, scale);

    let rafId = 0;
    let isIntersecting = true;
    let simTime = 12.0;
    let lastTime = performance.now();

    const render = () => {
      gl.uniform1f(uTime, simTime);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(0.4 * canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(0.4 * canvas.clientHeight * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
      render();
    };

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 100) / 1000;
      simTime += delta;
      lastTime = now;
      render();
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(rafId);
      if (!reducedMotion && isIntersecting && !document.hidden) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      } else {
        render(); // static fallback frame
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      start();
    });
    io.observe(canvas);

    const handleVisibility = () => {
      start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    resize();
    start();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [resolvedTheme, theme, tone]);

  return (
    <canvas
      ref={canvasRef}
      data-cloud-canvas={tone}
      aria-hidden="true"
      className={className}
    />
  );
}
