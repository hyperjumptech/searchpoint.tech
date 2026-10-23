"use client";

import * as React from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

import { LandingContainer } from "@/components/landing/landing-ui";
import { useLandingLanguage } from "@/components/landing/landing-language-provider";
import { CAPABILITY_CARDS } from "@/components/landing/data/capabilities";

export default function CapabilitiesSection() {
  const { t, lang } = useLandingLanguage();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(true);

  const updateScrollState = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();

    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollPrev = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".agent-card");
    const cardWidth = card?.offsetWidth || card?.clientWidth || 360;
    track.scrollBy({ left: -(cardWidth + 20), behavior: "smooth" });
  }, []);

  const scrollNext = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".agent-card");
    const cardWidth = card?.offsetWidth || card?.clientWidth || 360;
    track.scrollBy({ left: cardWidth + 20, behavior: "smooth" });
  }, []);

  const toggleRow = React.useCallback((rowId: string) => {
    setExpandedRow((prev) => (prev === rowId ? null : rowId));
  }, []);

  return (
    <section
      id="features"
      className="w-full max-w-full scroll-mt-[80px] py-8 md:py-16">
      <LandingContainer>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title max-w-[620px] font-display font-light text-foreground text-3xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] mt-3">
              {t("features.title")}
              <span className="text-primary">.</span>
            </h2>
          </div>

          {/* Desktop Carousel Controls */}
          <div className="hidden shrink-0 gap-2 md:flex">
            <button
              type="button"
              aria-label="Previous card"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="flex size-11 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:text-muted-foreground">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next card"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="flex size-11 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:text-muted-foreground">
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </LandingContainer>

      {/* Agent-style capability carousel */}
      <div className="relative mt-6 w-full max-w-full md:mt-[54px]">
        {/* Mobile controls sit above the cards */}
        <div className="mb-4 flex justify-end gap-2.5 px-6 md:hidden">
          <button
            type="button"
            aria-label="Previous card"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors active:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next card"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors active:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div
          aria-hidden="true"
          className="agent-fade-left pointer-events-none absolute inset-y-0 left-0 z-10 hidden md:block"
        />
        <div
          aria-hidden="true"
          className="agent-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[220px] md:block"
        />

        <div
          ref={trackRef}
          className="flex w-full max-w-full min-w-0 snap-x snap-mandatory items-start gap-[20px] overflow-x-auto scroll-smooth scroll-pl-6 px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:scroll-pl-[max(24px,calc((100vw-1152px)/2))] md:px-[max(24px,calc((100vw-1152px)/2))]">
          {CAPABILITY_CARDS.map((card) => {
            return (
              <article
                key={card.id}
                className="agent-card flex w-[78vw] max-w-[400px] shrink-0 snap-start flex-col rounded-[24px] p-[26px] transition-colors duration-300">
                {/* Hero area with dark gradient and tinted blur blob */}
                <div className="agent-hero relative overflow-hidden -mx-[26px] -mt-[26px] rounded-t-[24px] px-[26px] pt-[24px] pb-[20px]">
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    aria-hidden="true">
                    <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(155deg, #171717 0%, #0f0f0f 100%)",
                        }}
                      />
                      <div
                        className="absolute filter blur-[36px]"
                        style={{
                          left: card.blobStyle.left,
                          top: card.blobStyle.top,
                          width: card.blobStyle.width,
                          height: card.blobStyle.height,
                          background: card.blobStyle.background,
                          borderRadius: card.blobStyle.borderRadius,
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(10,10,10,0.12) 0%, rgba(10,10,10,0.4) 100%)",
                        }}
                      />
                      <div className="agent-noise absolute inset-0" />
                      <div className="agent-noise agent-noise-soft absolute inset-0" />
                    </div>
                  </div>

                  {/* Header row with glowing orbital avatar */}
                  <div className="relative flex items-center gap-4 pt-2">
                    <span
                      aria-hidden="true"
                      className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20"
                      style={{ background: card.avatarBg }}>
                      {card.avatarBlobs.map((blob, i) => (
                        <span
                          key={i}
                          className={clsx(
                            "absolute size-7",
                            blob.posClass,
                            blob.anim === "orbit"
                              ? "motion-safe:animate-[orbit_7s_linear_infinite]"
                              : "motion-safe:animate-[counter-orbit_5s_linear_infinite]",
                          )}
                          style={{
                            transformOrigin: "65% 65%",
                            animationDuration: blob.dur,
                          }}>
                          <span
                            className="block size-full rounded-full blur-[6px]"
                            style={{ background: blob.bg, opacity: 0.9 }}
                          />
                        </span>
                      ))}
                      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.45),transparent_55%)]" />
                    </span>

                    <div>
                      <h3 className="text-base font-semibold leading-tight text-white">
                        {t(card.titleKey)}
                      </h3>
                      <p className="mt-1 text-xs text-white/45">
                        {t(card.tagKey)}
                      </p>
                    </div>
                  </div>

                  <p className="relative mt-5 max-w-[340px] text-sm leading-[1.55] font-light text-white/70">
                    {t(card.descKey)}
                  </p>
                </div>

                {/* Expandable feature rows list */}
                <ul className="mt-3 border-b border-border/40">
                  {card.rows.map((row, rowIdx) => {
                    const rowKey = `${card.id}-${rowIdx}`;
                    const isExpanded = expandedRow === rowKey;
                    return (
                      <li
                        key={row.labelKey}
                        className="border-t border-border/40 first:border-t-0">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleRow(rowKey)}
                          className="group/row flex w-full items-baseline gap-[10px] py-[12px] text-left cursor-pointer">
                          <Plus
                            className={clsx(
                              "h-3 w-3 shrink-0 translate-y-[1px] text-muted-foreground transition-transform duration-200 group-hover/row:text-foreground",
                              isExpanded && "rotate-45",
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-[13.5px] leading-[1.5] font-light transition-colors duration-200 text-foreground/80 group-hover/row:text-foreground">
                            {t(row.labelKey)}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="pb-3 text-xs text-muted-foreground leading-relaxed pl-6 animate-in fade-in duration-200">
                            {row.detail[lang]}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
