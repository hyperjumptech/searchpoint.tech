/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ColleaguesInfoTooltip,
  COLLEAGUES_TOOLTIP_TEXT,
} from "./colleagues-info-tooltip";

describe("ColleaguesInfoTooltip", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the info icon with proper aria-label", () => {
    // Act
    render(<ColleaguesInfoTooltip />);

    // Assert
    const icon = screen.getByTestId("colleagues-info-icon");
    expect(icon).toBeDefined();
    expect(screen.getByLabelText(COLLEAGUES_TOOLTIP_TEXT)).toBeDefined();
  });

  it("displays the tooltip text on mouse hover", async () => {
    // Setup
    render(<ColleaguesInfoTooltip />);
    const tooltipTrigger = screen.getByLabelText(COLLEAGUES_TOOLTIP_TEXT);

    // Act
    fireEvent.mouseEnter(tooltipTrigger);

    // Assert
    const tooltipElement = await screen.findByRole("tooltip");
    expect(tooltipElement.textContent).toContain(COLLEAGUES_TOOLTIP_TEXT);

    // Act
    fireEvent.mouseLeave(tooltipTrigger);

    // Assert
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
