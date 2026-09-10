"use client";

import { useEffect } from "react";
import { Company, companyFromHostname, getCompanyFavicon } from "@/lib/company";

export default function CompanyFavicon({
  company: initialCompany,
}: {
  company?: Company;
} = {}) {
  useEffect(() => {
    const updateFavicon = () => {
      const company =
        initialCompany ||
        companyFromHostname(window.location.href || window.location.hostname);
      const favicon = getCompanyFavicon(company);

      let linkIco = document.querySelector<HTMLLinkElement>(
        "link[rel='icon'][type='image/x-icon']",
      );
      if (!linkIco) {
        linkIco = document.createElement("link");
        linkIco.rel = "icon";
        linkIco.type = "image/x-icon";
        document.head.appendChild(linkIco);
      }
      linkIco.href = favicon.ico;

      let linkPng = document.querySelector<HTMLLinkElement>(
        "link[rel='icon'][type='image/png']",
      );
      if (!linkPng) {
        linkPng = document.createElement("link");
        linkPng.rel = "icon";
        linkPng.type = "image/png";
        document.head.appendChild(linkPng);
      }
      linkPng.href = favicon.png;

      let linkApple = document.querySelector<HTMLLinkElement>(
        "link[rel='apple-touch-icon']",
      );
      if (!linkApple) {
        linkApple = document.createElement("link");
        linkApple.rel = "apple-touch-icon";
        document.head.appendChild(linkApple);
      }
      linkApple.href = favicon.png;
    };

    updateFavicon();
  }, [initialCompany]);

  return null;
}
