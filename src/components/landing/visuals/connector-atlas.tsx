"use client";

import * as React from "react";
import Image from "next/image";
import { clsx } from "clsx";

import {
  CONNECTOR_NODES,
  type ConnectorCategory,
} from "@/components/landing/data/connectors";

interface ConnectorAtlasProps {
  activeFilter: "all" | ConnectorCategory;
  activeKey: string;
  onSelectNode: (key: string, userInitiated?: boolean) => void;
  lang: "en" | "id";
}

interface NodePosition {
  x: number;
  y: number;
  line: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

const roundCoordinate = (value: number) => Math.round(value * 10000) / 10000;

export default function ConnectorAtlas({
  activeFilter,
  activeKey,
  onSelectNode,
  lang,
}: ConnectorAtlasProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState<{
    width: number;
    height: number;
  }>({
    width: 600,
    height: 600,
  });
  const [isReady, setIsReady] = React.useState(false);

  // ResizeObserver to track stage size
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
        setIsReady(true);
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => updateSize());
      ro.observe(stage);
      return () => ro.disconnect();
    } else {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, []);

  // Compute node coordinates and link vectors mathematically
  const nodePositions = React.useMemo<Record<string, NodePosition>>(() => {
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;
    const base = Math.min(width, height);
    const innerRadius = base * (width < 520 ? 0.3 : 0.29);
    const outerRadius = base * (width < 520 ? 0.42 : 0.405);
    const coreRadius = width < 640 ? 49 : 59;
    const orbRadius = 24;

    const positions: Record<string, NodePosition> = {};

    CONNECTOR_NODES.forEach((node) => {
      const angleRad = (node.angle * Math.PI) / 180;
      const radius = node.ring === "outer" ? outerRadius : innerRadius;
      const x = cx + Math.cos(angleRad) * radius;
      const y = cy + Math.sin(angleRad) * radius;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;

      positions[node.key] = {
        x: roundCoordinate(x),
        y: roundCoordinate(y),
        line: {
          x1: roundCoordinate(cx + ux * coreRadius),
          y1: roundCoordinate(cy + uy * coreRadius),
          x2: roundCoordinate(x - ux * orbRadius),
          y2: roundCoordinate(y - uy * orbRadius),
        },
      };
    });

    return positions;
  }, [dimensions]);

  const categoryLabels: Record<ConnectorCategory, { en: string; id: string }> =
    {
      ms: { en: "Microsoft 365", id: "Microsoft 365" },
      device: { en: "On-device", id: "Perangkat" },
      messaging: { en: "Messaging", id: "Perpesanan" },
      workspace: { en: "Google Workspace", id: "Google Workspace" },
    };

  return (
    <div className="cl-atlas">
      <div
        ref={stageRef}
        className={clsx("cl-stage", isReady && "is-ready")}
        id="clStage">
        {/* SVG connection rays */}
        <svg
          className="cl-links"
          id="clLinks"
          aria-hidden="true"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
          {CONNECTOR_NODES.map((node) => {
            const pos = nodePositions[node.key];
            if (!pos) return null;
            const isLineActive = node.key === activeKey;
            return (
              <line
                key={node.key}
                x1={pos.line.x1}
                y1={pos.line.y1}
                x2={pos.line.x2}
                y2={pos.line.y2}
                className={isLineActive ? "is-active" : undefined}
              />
            );
          })}
        </svg>

        {/* Orbit track rings */}
        <span className="cl-ring cl-ring--outer" aria-hidden="true" />
        <span className="cl-ring cl-ring--mid" aria-hidden="true" />
        <span className="cl-ring cl-ring--inner" aria-hidden="true" />

        {/* Central SearchPoint Knowledge Layer Core */}
        <div className="cl-core-wrap" aria-hidden="true">
          <span className="cl-core-pulse" />
          <span className="cl-core-pulse" />
          <span className="cl-core-halo" />
          <div className="cl-core">
            <span className="cl-core-line1">SEARCH</span>
            <span className="cl-core-line2">POINT</span>
            <span className="cl-core-tag">KNOWLEDGE LAYER</span>
          </div>
        </div>

        {/* Orbiting connector node buttons */}
        {CONNECTOR_NODES.map((node) => {
          const isSelected = node.key === activeKey;
          const isDimmed = activeFilter !== "all" && node.cat !== activeFilter;
          const pos = nodePositions[node.key];
          const style: React.CSSProperties = {
            ["--accent" as string]: node.accent,
            ["--d" as string]: `${node.delayMs}ms`,
            ...(pos ? { left: `${pos.x}px`, top: `${pos.y}px` } : {}),
          };

          return (
            <button
              key={node.key}
              type="button"
              className={clsx(
                "cl-node",
                isSelected && "is-active",
                isDimmed && "is-dim",
              )}
              style={style}
              onClick={() => onSelectNode(node.key, true)}
              onFocus={() => onSelectNode(node.key, true)}
              title={`${node.name}${node.status === "soon" ? " — roadmap" : ""}`}
              aria-label={`${node.name} connector (${categoryLabels[node.cat][lang]})`}>
              <span className="cl-node-orb">
                <span className="cl-node-halo" />
                <span className="cl-node-icon">
                  <Image
                    src={node.icon}
                    alt=""
                    width={22}
                    height={22}
                    unoptimized
                  />
                </span>
              </span>

              {node.status === "soon" && (
                <span className="cl-node-soon">
                  {lang === "id" ? "Segera" : "Soon"}
                </span>
              )}

              <span className="cl-node-text">
                <span className="cl-node-name">{node.name}</span>
                <span className="cl-node-cat">
                  {categoryLabels[node.cat][lang]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
