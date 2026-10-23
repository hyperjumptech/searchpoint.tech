"use client";

import * as React from "react";
import { clsx } from "clsx";
import { Plus } from "lucide-react";

import { LandingContainer } from "@/components/landing/landing-ui";
import { useLandingLanguage } from "@/components/landing/landing-language-provider";
import { FAQ_DATA, type FaqItem } from "@/components/landing/data/faq";

export default function FaqSection() {
  const { t, lang } = useLandingLanguage();
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());
  const [visibleItems, setVisibleItems] = React.useState<Set<number>>(
    new Set(),
  );
  const listRef = React.useRef<HTMLUListElement>(null);

  const faqItems: FaqItem[] = React.useMemo(() => {
    return FAQ_DATA[lang] || FAQ_DATA.en;
  }, [lang]);

  // Handle accordion toggle (multi-open supported)
  const toggleItem = React.useCallback((index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // IntersectionObserver reveal on scroll
  React.useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    ) {
      setVisibleItems(new Set(faqItems.map((_, i) => i)));
      return;
    }

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idxStr = entry.target.getAttribute("data-idx");
              if (idxStr !== null) {
                const idx = parseInt(idxStr, 10);
                setVisibleItems((prev) => new Set(prev).add(idx));
                observer.unobserve(entry.target);
              }
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -4% 0px" },
      );

      const items = listEl.querySelectorAll<HTMLLIElement>(".faq-item");
      items.forEach((item) => observer.observe(item));

      return () => observer.disconnect();
    } else {
      setVisibleItems(new Set(faqItems.map((_, i) => i)));
    }
  }, [faqItems]);

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-border/40 py-16 md:py-20">
      <LandingContainer>
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="section-title font-display font-light text-foreground text-3xl md:text-5xl tracking-tight leading-[1.1] max-w-[580px] mt-3">
            {t("faq.title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground font-light max-w-[520px] leading-relaxed">
            {t("faq.desc")}
          </p>
        </div>

        {/* Accordion Questions List */}
        <ul ref={listRef} className="faq-list">
          {faqItems.map((item, idx) => {
            const isOpen = openItems.has(idx);
            const isVisible = visibleItems.has(idx);
            const panelId = `sp-faq-panel-${idx}`;
            const questionId = `sp-faq-q-${idx}`;
            const revealDelay = `${Math.min(idx * 55, 440)}ms`;

            return (
              <li
                key={`${lang}-${idx}`}
                data-idx={idx}
                className={clsx(
                  "faq-item",
                  isOpen && "is-open",
                  isVisible && "is-visible",
                )}
                style={{ ["--reveal-delay" as string]: revealDelay }}>
                <button
                  type="button"
                  id={questionId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(idx)}
                  className="faq-question">
                  <span className="faq-icon" aria-hidden="true">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  <span className="faq-question-text">{item.q}</span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={questionId}
                  className="faq-answer">
                  <div className="faq-answer-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </LandingContainer>
    </section>
  );
}
