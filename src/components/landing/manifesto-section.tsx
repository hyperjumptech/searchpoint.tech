"use client";

import * as React from "react";
import { useLandingLanguage } from "@/components/landing/landing-language-provider";

export default function ManifestoSection() {
  const { t, lang } = useLandingLanguage();
  const [cardsSettled, setCardsSettled] = React.useState(false);

  React.useEffect(() => {
    const section = document.getElementById("manifesto");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCardsSettled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="manifesto" className="w-full px-4 sm:px-6 py-16 md:py-24">
      <div className="manifesto-track relative">
        <div className="sp-manifesto-card manifesto-permission flex items-center overflow-hidden">
          {/* Distinct ambient motif: dynamic rings, drifting lattice, scan sweep */}
          <div
            aria-hidden="true"
            className="manifesto-perimeter pointer-events-none absolute inset-0">
            <div className="mp-grid" />
            <div className="mp-rings">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="mp-scan" />
          </div>

          {/* Ambient Floating Cards */}
          <div
            aria-hidden="true"
            className={`manifesto-ambient pointer-events-none absolute inset-0 ${
              cardsSettled ? "is-settled" : ""
            }`}>
            {/* Floating Card 1 */}
            <div className="mp-card mp-card-1">
              <div className="mp-card-inner">
                <span className="mp-card-source mp-source-blue">
                  OneDrive Business
                </span>
                <span className="mp-card-title">Q3_Financial_Audit.xlsx</span>
                <span className="mp-card-meta">M365 ACL Synchronized</span>
              </div>
            </div>

            {/* Floating Card 2 */}
            <div className="mp-card mp-card-2">
              <div className="mp-card-inner">
                <span className="mp-card-source mp-source-green">
                  HashiCorp Vault
                </span>
                <span className="mp-card-title">KMS Auto-Unseal Active</span>
                <span className="mp-card-meta">Zero Stored Credentials</span>
              </div>
            </div>

            {/* Floating Card 3 */}
            <div className="mp-card mp-card-3">
              <div className="mp-card-inner">
                <span className="mp-card-source mp-source-purple">
                  Hybrid Search Engine
                </span>
                <span className="mp-card-title">
                  Sub-50ms Multilingual Retrieval
                </span>
                <span className="mp-card-meta">
                  English + Indonesian Stemming
                </span>
              </div>
            </div>

            {/* Floating Card 4 */}
            <div className="mp-card mp-card-4">
              <div className="mp-card-inner">
                <span className="mp-card-source mp-source-red">
                  Security Barrier
                </span>
                <span className="mp-card-title">Zero Document Retention</span>
                <span className="mp-card-meta">Fail-Closed Authorization</span>
              </div>
            </div>
          </div>

          {/* Center Manifesto Typography */}
          <div className="mp-copy">
            <h2 className="section-title font-display font-light text-balance mp-title text-xl md:text-3xl lg:text-4xl leading-[1.25]">
              {lang === "id" ? (
                <>
                  Pencarian enterprise gagal karena menyalin berkas ke silo
                  sekunder. Masa depan pengetahuan milik{" "}
                  <span className="mp-highlight">
                    lapisan nol-retensi yang sepenuhnya patuh izin.
                  </span>
                </>
              ) : (
                <>
                  Enterprise search failed because it copied files into
                  secondary silos. The future of knowledge belongs to the{" "}
                  <span className="mp-highlight">
                    zero-retention, permission-true layer.
                  </span>
                </>
              )}
            </h2>
            <p className="mp-desc">{t("man.desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
