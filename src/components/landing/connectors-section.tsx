"use client";

import * as React from "react";

import { LandingContainer } from "@/components/landing/landing-ui";
import { useLandingLanguage } from "@/components/landing/landing-language-provider";
import ConnectorAtlas from "@/components/landing/visuals/connector-atlas";
import { CONNECTOR_NODES } from "@/components/landing/data/connectors";

export default function ConnectorsSection() {
  const { t, lang } = useLandingLanguage();
  const activeFilter = "all";
  const [activeKey, setActiveKey] = React.useState<string>("onedrive");
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const interactedRef = React.useRef<boolean>(false);

  // Eligible nodes for rotation (not soon, matching current filter)
  const eligibleNodes = React.useMemo(() => {
    return CONNECTOR_NODES.filter((node) => {
      const matchesFilter = activeFilter === "all" || node.cat === activeFilter;
      return matchesFilter && node.status !== "soon";
    });
  }, [activeFilter]);

  // Autoplay rotation every 3.8s
  React.useEffect(() => {
    if (isPaused || interactedRef.current) return;

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = setInterval(() => {
      if (interactedRef.current || eligibleNodes.length === 0) return;
      setActiveKey((prevKey) => {
        const currentIndex = eligibleNodes.findIndex((n) => n.key === prevKey);
        const nextIndex = (currentIndex + 1) % eligibleNodes.length;
        return eligibleNodes[nextIndex].key;
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused, eligibleNodes]);

  const handleSelectNode = React.useCallback(
    (key: string, userInitiated = false) => {
      setActiveKey(key);
      if (userInitiated) {
        interactedRef.current = true;
      }
    },
    [],
  );

  return (
    <section
      id="connectors"
      className="sp-connectors connector-glow relative overflow-hidden border-t border-border/40 py-24 md:py-32">
      <LandingContainer className="text-center">
        <h2 className="sp-section-title font-display font-light text-foreground text-3xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] mt-3">
          {t("connectors.title")}
        </h2>
        <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
          {t("connectors.desc")}
        </p>

        {/* Interactive Connector Atlas Stage */}
        <div
          className="mt-8"
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}>
          <ConnectorAtlas
            activeFilter={activeFilter}
            activeKey={activeKey}
            onSelectNode={handleSelectNode}
            lang={lang}
          />
        </div>

        {/* The two trust planes: Identity vs Secrets */}
        {/*
        <div className="mx-auto mt-20 md:mt-24 max-w-2xl text-center">
          <h3 className="section-title font-display font-light text-foreground text-2xl md:text-4xl mt-3">
            {t("connectors.trust_title")}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
            {t("connectors.trust_desc")}
          </p>
        </div>

        <div className="cl-pair">
          <article className="cl-plane cl-plane--identity">
            <div className="cl-plane-head">
              <span className="cl-plane-icon">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="cl-plane-badge">
                {t("connectors.identity_badge")}
              </span>
            </div>
            <h4 className="cl-plane-title">{t("connectors.identity_title")}</h4>
            <p className="cl-plane-desc">{t("connectors.identity_desc")}</p>
            <ul className="cl-plane-list">
              <li>
                <span className="cl-plane-tick" aria-hidden="true">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{t("connectors.identity_p1")}</span>
              </li>
              <li>
                <span className="cl-plane-tick" aria-hidden="true">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{t("connectors.identity_p2")}</span>
              </li>
              <li>
                <span className="cl-plane-tick" aria-hidden="true">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{t("connectors.identity_p3")}</span>
              </li>
            </ul>
            <p className="cl-plane-note">{t("connectors.identity_note")}</p>
          </article>

          <article className="cl-plane cl-plane--secrets">
            <div className="cl-plane-head">
              <span className="cl-plane-icon">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="cl-plane-badge">
                {t("connectors.secrets_badge")}
              </span>
            </div>
            <h4 className="cl-plane-title">{t("connectors.secrets_title")}</h4>
            <p className="cl-plane-desc">{t("connectors.secrets_desc")}</p>
            <ul className="cl-plane-list">
              <li>
                <span className="cl-plane-tick" aria-hidden="true">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{t("connectors.secrets_p1")}</span>
              </li>
              <li>
                <span className="cl-plane-tick" aria-hidden="true">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{t("connectors.secrets_p2")}</span>
              </li>
              <li>
                <span className="cl-plane-tick" aria-hidden="true">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{t("connectors.secrets_p3")}</span>
              </li>
            </ul>
            <p className="cl-plane-note">{t("connectors.secrets_note")}</p>
          </article>
        </div>
        */}
      </LandingContainer>
    </section>
  );
}
