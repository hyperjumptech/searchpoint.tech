/** @vitest-environment jsdom */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HeroSection from "@/components/landing/hero-section";
import { LandingLanguageProvider } from "@/components/landing/landing-language-provider";

vi.mock("@/components/landing/visuals/cloud-canvas", () => ({
  CloudCanvas: () => <div data-testid="cloud-canvas" />,
}));

vi.mock("@/components/landing/visuals/hero-waves", () => ({
  HeroWaves: () => <div data-testid="hero-waves" />,
}));

vi.mock("@/components/landing/visuals/hero-orbits", () => ({
  HeroOrbits: () => <div data-testid="hero-orbits" />,
}));

describe("HeroSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders English banner headline and subheadline by default", () => {
    render(
      <LandingLanguageProvider defaultLang="en">
        <HeroSection />
      </LandingLanguageProvider>,
    );

    expect(screen.getByText("The AI Knowledge Layer")).toBeDefined();
    expect(screen.getByText("for Multi source Enterprise Data")).toBeDefined();
    expect(
      screen.getByText(
        /SearchPoint connects every file source in your company/i,
      ),
    ).toBeDefined();
    expect(screen.getByText("Get App")).toBeDefined();
    expect(screen.getByText("Explore Desktop Demo ↓")).toBeDefined();
  });

  it("renders Indonesian banner headline and subheadline when language is switched to id", () => {
    render(
      <LandingLanguageProvider defaultLang="id">
        <HeroSection
          content={{
            headlineLead: "Unified search for your files and",
            headlineAccent: "Microsoft 365.",
            subheadline:
              "SearchPoint connects every file source in your company, understands the document context, and turns questions into answers and actions.",
          }}
        />
      </LandingLanguageProvider>,
    );

    expect(screen.getByText("AI Knowledge Layer")).toBeDefined();
    expect(
      screen.getByText("untuk Data Enterprise Multi-sumber"),
    ).toBeDefined();
    expect(
      screen.getByText(
        /SearchPoint menghubungkan setiap sumber berkas di perusahaan Anda/i,
      ),
    ).toBeDefined();
    expect(screen.getByText("Dapatkan Aplikasi")).toBeDefined();
    expect(screen.getByText("Lihat Demo Desktop Interaktif ↓")).toBeDefined();
  });
});
