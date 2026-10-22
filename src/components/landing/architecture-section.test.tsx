/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ArchitectureSection from "@/components/landing/architecture-section";
import { LandingLanguageProvider } from "@/components/landing/landing-language-provider";

describe("ArchitectureSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders knowledge layer heading and description", () => {
    render(
      <LandingLanguageProvider defaultLang="en">
        <ArchitectureSection />
      </LandingLanguageProvider>,
    );

    expect(screen.getByText("Inside the Knowledge Layer.")).toBeDefined();
    expect(screen.getByText(/Not another tool on the side/i)).toBeDefined();
  });

  it("renders Data Platform card with all tool connectors and direct arrow out", () => {
    render(
      <LandingLanguageProvider defaultLang="en">
        <ArchitectureSection />
      </LandingLanguageProvider>,
    );

    expect(screen.getByText("Data Platform")).toBeDefined();

    // Tools / Sources
    expect(screen.getByText("OneDrive")).toBeDefined();
    expect(screen.getByText("SharePoint")).toBeDefined();
    expect(screen.getAllByText("SearchPoint").length).toBeGreaterThan(0);
    expect(screen.getByText("Local Storage")).toBeDefined();
    expect(screen.getByText("Google Drive")).toBeDefined();
    expect(screen.getByText("Outlook")).toBeDefined();
    expect(screen.getByText(/10\+\s*Sources/)).toBeDefined();
  });

  it("renders SearchPoint Core Engine with all 5 engine layers and lock-in disclaimer", () => {
    render(
      <LandingLanguageProvider defaultLang="en">
        <ArchitectureSection />
      </LandingLanguageProvider>,
    );

    expect(screen.getByText("Core Engine")).toBeDefined();
    expect(screen.getAllByText("SearchPoint").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Delta Ingestion")).toBeDefined();
    expect(screen.getByText("Real-time Graph & filesystem sync")).toBeDefined();
    expect(screen.getByText("Native Sandbox")).toBeDefined();
    expect(
      screen.getByText("Ephemeral parsing, zero data retention"),
    ).toBeDefined();
    expect(screen.getByText("Purview Snapshot")).toBeDefined();
    expect(screen.getByText("Fail-closed document-level ACLs")).toBeDefined();
    expect(screen.getByText("Hybrid Search Engine")).toBeDefined();
    expect(screen.getByText("Sub-50ms vector & BM25 retrieval")).toBeDefined();
    expect(screen.getByText("Grounded RAG")).toBeDefined();
    expect(screen.getByText("Zero-leak context for any LLM")).toBeDefined();

    expect(
      screen.getByText(
        /Bring any AI model — even open-weights on your own servers/i,
      ),
    ).toBeDefined();
  });

  it("renders AI Workforce nodes and bottom compliance brackets", () => {
    render(
      <LandingLanguageProvider defaultLang="en">
        <ArchitectureSection />
      </LandingLanguageProvider>,
    );

    expect(screen.getByText("Your AI Workforce")).toBeDefined();
    expect(screen.getByText("You")).toBeDefined();
    expect(screen.getByText("Owner")).toBeDefined();
    expect(screen.getByText("Sales")).toBeDefined();
    expect(screen.getByText("Pipeline")).toBeDefined();
    expect(screen.getAllByText("Ops").length).toBeGreaterThan(0);
    expect(screen.getByText("Tickets")).toBeDefined();
    expect(screen.getByText("Finance")).toBeDefined();
    expect(screen.getByText("Books")).toBeDefined();
    expect(screen.getByText("Support")).toBeDefined();
    expect(screen.getByText("Replies")).toBeDefined();
    expect(screen.getByText("Inventory")).toBeDefined();
    expect(screen.getByText("Stock")).toBeDefined();

    expect(
      screen.getAllByText(
        /Secure & compliant · Deploys in your cloud or on-prem/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Your team/i).length).toBeGreaterThan(0);
  });
});
