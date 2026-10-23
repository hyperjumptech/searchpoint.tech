"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Cloud, Server, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingLanguage } from "./landing-language-provider";

// Background Seal spinning geometric rosette
function EnterpriseSealBackground() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -top-16 -right-16 -z-10 size-[420px] text-black opacity-[0.16] dark:text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.4">
      <g
        style={{
          transformOrigin: "100px 100px",
          animation: "nx-seal-spin 90s linear infinite",
        }}>
        {Array.from({ length: 36 }, (_, a) => (
          <ellipse
            key={a}
            cx="100"
            cy="100"
            rx="90"
            ry="34"
            transform={`rotate(${5 * a} 100 100)`}
          />
        ))}
      </g>
      <g
        opacity="0.5"
        style={{
          transformOrigin: "100px 100px",
          animation: "nx-seal-spin 140s linear infinite reverse",
        }}>
        {Array.from({ length: 18 }, (_, a) => (
          <ellipse
            key={a}
            cx="100"
            cy="100"
            rx="70"
            ry="22"
            transform={`rotate(${10 * a} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="92" />
      <circle cx="100" cy="100" r="30" />
    </svg>
  );
}

function FlexibleDeploymentVisual({ open }: { open: boolean }) {
  const { t } = useLandingLanguage();
  const [activeIdx, setActiveIdx] = React.useState(0);

  const deployOptions = React.useMemo(
    () => [
      {
        Icon: Cloud,
        label: t("enterprise.v1_cloud"),
        sub: t("enterprise.v1_vpc"),
      },
      {
        Icon: Server,
        label: t("enterprise.v1_onprem"),
        sub: t("enterprise.v1_datacenter"),
      },
    ],
    [t],
  );

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % deployOptions.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [open, deployOptions.length]);

  return (
    <div className="flex flex-col gap-2 py-1">
      <p className="text-[11px] leading-[1.4] font-light text-white/40">
        {t("enterprise.v1_deploy_to")}
      </p>
      {deployOptions.map(({ Icon, label, sub }, idx) => {
        const isSelected = activeIdx === idx;
        return (
          <div
            key={label}
            className="relative flex items-center gap-3 rounded-[10px] px-3 py-2.5">
            {isSelected && (
              <motion.span
                layoutId="deploy-pick"
                transition={{ type: "spring", stiffness: 420, damping: 38 }}
                className="absolute inset-0 rounded-[10px] border border-white/15 bg-white/[0.06]"
              />
            )}
            <Icon
              className={cn(
                "relative size-4 transition-colors duration-300",
                isSelected ? "text-white" : "text-white/35",
              )}
              strokeWidth={1.5}
            />
            <span className="relative flex flex-1 flex-col">
              <span
                className={cn(
                  "text-[11px] leading-[1.4] transition-colors duration-300",
                  isSelected ? "text-white" : "text-white/55",
                )}>
                {label}
              </span>
              <span className="text-[11px] leading-[1.4] font-light text-white/35">
                {sub}
              </span>
            </span>
            <span
              className={cn(
                "relative flex size-3.5 items-center justify-center rounded-full border transition-colors duration-300",
                isSelected ? "border-white" : "border-white/25",
              )}>
              <span
                className={cn(
                  "size-1.5 rounded-full bg-white transition-transform duration-300",
                  isSelected ? "scale-100" : "scale-0",
                )}
              />
            </span>
          </div>
        );
      })}
      <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] leading-[1.4] font-light">
        <span className="text-white/55">{t("enterprise.v1_records")}</span>
        <span className="font-display text-[20px] leading-[1.35] text-white tabular-nums">
          0
        </span>
      </div>
    </div>
  );
}

// 2. Permission-aware visual preview
function PermissionAwareVisual({ open }: { open: boolean }) {
  const { t } = useLandingLanguage();

  const permissionUsers = React.useMemo(
    () => [
      { initials: "VT", role: t("enterprise.v2_finance"), allowed: true },
      { initials: "RP", role: t("enterprise.v2_sales"), allowed: false },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-3 py-1">
      <p className="text-[11px] leading-[1.4] font-light text-white/45">
        {t("enterprise.v2_prompt")}
      </p>
      {permissionUsers.map((user, idx) => (
        <div
          key={user.initials}
          className="flex items-center gap-3 border-t border-white/10 pt-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-[11px] leading-[1.4] font-light text-white/70">
            {user.initials}
          </span>
          <span className="flex-1 text-[11px] leading-[1.4] font-light text-white/55">
            {user.role}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="font-display text-[20px] leading-[1.35] font-light text-white tabular-nums transition-[filter,opacity] duration-700 ease-out"
              style={{
                filter: !user.allowed && open ? "blur(6px)" : "blur(0px)",
                opacity: !user.allowed && open ? 0.6 : 1,
                transitionDelay: open ? `${250 + 150 * idx}ms` : "0ms",
              }}>
              18,4%
            </span>
            {user.allowed ? (
              <Check className="size-3.5 text-white/70" strokeWidth={1.5} />
            ) : (
              <Lock className="size-3.5 text-white/50" strokeWidth={1.5} />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// 3. Data protection visual preview (with text scrambling encryption animation)
const INVOICE_LINES = ["PT Sinar Jaya", "Invoice 0417", "Rp 184.000.000"];
const CIPHER_CHARS = "ABCDEF0123456789#$%&*+=/<>";

function DataProtectionVisual({ open }: { open: boolean }) {
  const { t } = useLandingLanguage();
  const [displayLines, setDisplayLines] = React.useState(INVOICE_LINES);

  React.useEffect(() => {
    if (!open) {
      setDisplayLines(INVOICE_LINES);
      return;
    }

    const startTime = performance.now();
    const interval = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startTime - 250) / 900);
      setDisplayLines(
        INVOICE_LINES.map((line, lIdx) =>
          line
            .split("")
            .map((char, cIdx) => {
              if (char === " ") return " ";
              if (cIdx < progress * (line.length + 4) - 2 * lIdx) {
                return CIPHER_CHARS[
                  Math.floor(Math.random() * CIPHER_CHARS.length)
                ];
              }
              return char;
            })
            .join(""),
        ),
      );
    }, 60);

    return () => window.clearInterval(interval);
  }, [open]);

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex flex-col gap-1.5 font-mono text-[11px] leading-[1.4] tracking-wide text-white/70 tabular-nums">
        {displayLines.map((line, idx) => (
          <span key={idx} className="whitespace-pre">
            {line}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] leading-[1.4] font-light">
        <span className="flex items-center gap-1.5 text-white/55">
          <Lock className="size-3" strokeWidth={1.5} />{" "}
          {t("enterprise.v3_transit")}
        </span>
        <span className="text-white">{t("enterprise.v3_encrypted")}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] leading-[1.4] font-light">
        <span className="text-white/55">{t("enterprise.v3_train")}</span>
        <span className="font-display text-[20px] leading-[1.35] text-white tabular-nums">
          0
        </span>
      </div>
    </div>
  );
}

// 4. Compliance & standards visual preview (with spinning circular seal)
function ComplianceVisual({ open }: { open: boolean }) {
  const { t } = useLandingLanguage();

  return (
    <div className="flex items-center gap-5 py-1">
      <svg viewBox="0 0 120 120" className="size-28 shrink-0" fill="none">
        <defs>
          <path
            id="nx-seal-ring"
            d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"
          />
        </defs>
        <circle cx="60" cy="60" r="56" stroke="rgba(255,255,255,0.14)" />
        <circle cx="60" cy="60" r="33" stroke="rgba(255,255,255,0.22)" />
        <g
          style={{
            transformOrigin: "60px 60px",
            animation: "nx-seal-spin 18s linear infinite",
            animationPlayState: open ? "running" : "paused",
          }}>
          <text
            fill="rgba(255,255,255,0.55)"
            fontSize="7.6"
            letterSpacing="0.16em">
            <textPath href="#nx-seal-ring">{t("enterprise.v4_seal")}</textPath>
          </text>
        </g>
        <path
          d="M60 44 l12 5 v9 c0 8 -5 14 -12 17 c-7 -3 -12 -9 -12 -17 v-9 z"
          stroke="white"
          strokeWidth="1.1"
        />
        <path d="M55 59 l4 4 l7 -8" stroke="white" strokeWidth="1.1" />
      </svg>
      <div className="flex flex-col gap-2 text-[11px] leading-[1.4] font-light">
        <span className="text-white">{t("enterprise.v4_soc2")}</span>
        <span className="text-white">{t("enterprise.v4_residency")}</span>
        <span className="text-white/45">{t("enterprise.v4_plans")}</span>
      </div>
    </div>
  );
}

export default function EnterpriseSection() {
  const { t } = useLandingLanguage();
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  const sections = React.useMemo(
    () => [
      {
        title: t("enterprise.s1_title"),
        body: t("enterprise.s1_body"),
        Visual: FlexibleDeploymentVisual,
      },
      {
        title: t("enterprise.s2_title"),
        body: t("enterprise.s2_body"),
        Visual: PermissionAwareVisual,
      },
      {
        title: t("enterprise.s3_title"),
        body: t("enterprise.s3_body"),
        Visual: DataProtectionVisual,
      },
      {
        title: t("enterprise.s4_title"),
        body: t("enterprise.s4_body"),
        Visual: ComplianceVisual,
      },
    ],
    [t],
  );

  return (
    <section className="w-full px-6 pb-16 md:pb-20" id="enterprise">
      <div className="mx-auto w-full max-w-[1340px] relative isolate overflow-hidden rounded-[24px] bg-[#f4f1e9] px-6 py-16 dark:bg-[rgb(17,14,7)] md:px-20 md:py-24">
        {/* Background spinning seal geometry */}
        <EnterpriseSealBackground />

        {/* Section title & subtitle */}
        <h2 className="max-w-[760px] font-display text-[32px] leading-[1.25] font-light text-balance text-black/60 dark:text-white/80 md:text-[42px] md:leading-[1.25]">
          <span className="text-black dark:text-white">
            {t("enterprise.title")}
          </span>
          <br />
          {t("enterprise.sub1")}
          <br />
          {t("enterprise.sub2")}
        </h2>

        {/* Accordion List */}
        <ul
          className="mt-16 border-b border-black/10 dark:border-white/10 md:mt-24"
          onMouseLeave={() => setOpenIdx(null)}>
          {sections.map(({ title, body, Visual }, idx) => {
            const isOpen = openIdx === idx;
            const isDimmed = openIdx !== null && !isOpen;

            return (
              <li
                key={title}
                className="border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onMouseEnter={() => setOpenIdx(idx)}
                  onFocus={() => setOpenIdx(idx)}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className={cn(
                    "flex w-full cursor-pointer flex-col gap-3 py-7 text-left outline-none transition-colors duration-500 md:-mx-20 md:w-[calc(100%+10rem)] md:flex-row md:items-center md:justify-between md:gap-10 md:px-20 md:py-9",
                    isOpen && "bg-white/[0.035]",
                  )}>
                  <h3
                    className={cn(
                      "text-[20px] leading-[1.35] font-light transition-colors duration-300 md:text-2xl",
                      isDimmed
                        ? "text-black/35 dark:text-white/35"
                        : "text-black dark:text-white",
                    )}>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mr-0 inline-block h-px bg-current align-middle transition-all duration-500 ease-out",
                        isOpen ? "mr-4 w-6" : "w-0",
                      )}
                    />
                    {title}
                  </h3>

                  <div className="flex w-full flex-col md:w-auto md:shrink-0 md:flex-row md:items-center">
                    {/* Collapsible card visual */}
                    <div
                      className={cn(
                        "order-2 grid transition-[grid-template-rows] duration-500 ease-out md:order-1 md:w-[340px]",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}>
                      <div className="overflow-hidden">
                        <div
                          aria-hidden={!isOpen}
                          className={cn(
                            "max-w-[300px] pt-5 transition-opacity md:max-w-none duration-500 ease-out md:pt-0 md:pr-10",
                            isOpen ? "opacity-100" : "opacity-0",
                          )}>
                          <div className="relative overflow-hidden rounded bg-[#0d0d0d] p-5 [filter:invert(1)_hue-rotate(180deg)]">
                            {/* Grid lattice mask */}
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:5px_5px] [mask-image:radial-gradient(ellipse_80%_70%_at_30%_40%,black,transparent)]"
                            />
                            {/* Ambient blur orb */}
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute -top-10 -left-10 size-48 rounded-full bg-white/[0.06] blur-2xl"
                            />
                            {/* Content */}
                            <div className="relative">
                              <Visual open={isOpen} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory caption text */}
                    <p
                      className={cn(
                        "order-1 text-[13px] leading-[1.5] font-light transition-colors duration-300 md:order-2 md:w-[320px]",
                        isOpen
                          ? "text-black/80 dark:text-white/80"
                          : "text-black/50 dark:text-white/50",
                      )}>
                      {body}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes nx-seal-spin { to { transform: rotate(360deg); } }`,
        }}
      />
    </section>
  );
}
