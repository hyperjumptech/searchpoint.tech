/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EnterpriseSection from "@/components/landing/enterprise-section";

describe("EnterpriseSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders main enterprise headline and subheadline matching nalarx.com", () => {
    render(<EnterpriseSection />);

    expect(screen.getByText("Built for the enterprise.")).toBeDefined();
    expect(screen.getByText(/From deployment to compliance,/i)).toBeDefined();
    expect(
      screen.getByText(/every layer meets your audit bar\./i),
    ).toBeDefined();
  });

  it("renders all 4 accordion items with their titles and descriptions", () => {
    render(<EnterpriseSection />);

    // 1. Flexible deployment
    expect(screen.getByText("Flexible deployment")).toBeDefined();
    expect(
      screen.getByText(
        "Runs in your cloud or fully on-prem. Your records never leave your environment.",
      ),
    ).toBeDefined();

    // 2. Permission-aware
    expect(screen.getByText("Permission-aware")).toBeDefined();
    expect(
      screen.getByText(
        "Agents inherit the roles people already have. Every answer stays inside what that person may see.",
      ),
    ).toBeDefined();

    // 3. Data protection
    expect(screen.getByText("Data protection")).toBeDefined();
    expect(
      screen.getByText(
        "Your data never trains public models. Encrypted in transit and at rest, any model you choose.",
      ),
    ).toBeDefined();

    // 4. Compliance & standards
    expect(screen.getByText("Compliance & standards")).toBeDefined();
    expect(
      screen.getByText(
        "SOC 2 compliance and dedicated data residency on enterprise plans, with access controls you define.",
      ),
    ).toBeDefined();
  });

  it("expands items on click or hover", () => {
    render(<EnterpriseSection />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);

    // Click first button
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");

    // Click again to toggle off
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");

    // Hover second button
    fireEvent.mouseEnter(buttons[1]);
    expect(buttons[1].getAttribute("aria-expanded")).toBe("true");
  });
});
