/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with aria-checked reflecting checked state", () => {
    const { rerender } = render(
      <Switch
        checked={false}
        onCheckedChange={() => {}}
        aria-label="Toggle setting"
      />,
    );

    const switchBtn = screen.getByRole("switch", { name: "Toggle setting" });
    expect(switchBtn.getAttribute("aria-checked")).toBe("false");

    rerender(
      <Switch
        checked={true}
        onCheckedChange={() => {}}
        aria-label="Toggle setting"
      />,
    );
    expect(switchBtn.getAttribute("aria-checked")).toBe("true");
  });

  it("calls onCheckedChange on click", () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        checked={false}
        onCheckedChange={onCheckedChange}
        aria-label="Toggle setting"
      />,
    );

    const switchBtn = screen.getByRole("switch", { name: "Toggle setting" });
    fireEvent.click(switchBtn);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("is disabled when disabled prop is true", () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        checked={false}
        disabled={true}
        onCheckedChange={onCheckedChange}
        aria-label="Disabled setting"
      />,
    );

    const switchBtn = screen.getByRole("switch", { name: "Disabled setting" });
    expect(switchBtn).toHaveProperty("disabled", true);

    fireEvent.click(switchBtn);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders children label text alongside switch control", () => {
    render(
      <Switch checked={true} onCheckedChange={() => {}}>
        Enable notifications
      </Switch>,
    );

    expect(screen.getByText("Enable notifications")).toBeDefined();
  });
});
