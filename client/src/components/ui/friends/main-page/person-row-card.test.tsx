// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonRowCard } from "./person-row-card";

function makeFriend(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    username: "johndoe",
    email: "john@example.com",
    stats: {
      totalWagers: 10,
      wins: 6,
      losses: 3,
      draws: 1,
      winRate: 60,
      netPnl: "25.00",
    },
    ...overrides,
  };
}

describe("PersonRowCard", () => {
  describe("content", () => {
    it("renders the friend's username", () => {
      render(<PersonRowCard friend={makeFriend()} isActive={false} onClick={vi.fn()} />);
      expect(screen.getByText("johndoe")).toBeInTheDocument();
    });

    it("renders the win-loss record without draws when draws is 0", () => {
      render(
        <PersonRowCard
          friend={makeFriend({ stats: { wins: 4, losses: 2, draws: 0, totalWagers: 6, winRate: 67, netPnl: "0" } })}
          isActive={false}
          onClick={vi.fn()}
        />,
      );
      expect(screen.getByText("4W - 2L")).toBeInTheDocument();
    });

    it("renders the win-loss-draw record when draws is greater than 0", () => {
      render(<PersonRowCard friend={makeFriend()} isActive={false} onClick={vi.fn()} />);
      expect(screen.getByText("6W - 3L - 1D")).toBeInTheDocument();
    });
  });

  describe("net P&L display", () => {
    it("shows +XX.XX with emerald colour for a positive net P&L", () => {
      render(
        <PersonRowCard
          friend={makeFriend({ stats: { wins: 1, losses: 0, draws: 0, totalWagers: 1, winRate: 100, netPnl: "50.00" } })}
          isActive={false}
          onClick={vi.fn()}
        />,
      );
      const pnl = screen.getByText("+50.00");
      expect(pnl).toBeInTheDocument();
      expect(pnl).toHaveClass("text-emerald-300");
    });

    it("shows -XX.XX with rose colour for a negative net P&L", () => {
      render(
        <PersonRowCard
          friend={makeFriend({ stats: { wins: 0, losses: 1, draws: 0, totalWagers: 1, winRate: 0, netPnl: "-20.00" } })}
          isActive={false}
          onClick={vi.fn()}
        />,
      );
      const pnl = screen.getByText("-20.00");
      expect(pnl).toBeInTheDocument();
      expect(pnl).toHaveClass("text-rose-300");
    });

    it("shows 0.00 with neutral colour for a zero net P&L", () => {
      render(
        <PersonRowCard
          friend={makeFriend({ stats: { wins: 1, losses: 1, draws: 0, totalWagers: 2, winRate: 50, netPnl: "0" } })}
          isActive={false}
          onClick={vi.fn()}
        />,
      );
      const pnl = screen.getByText("0.00");
      expect(pnl).toBeInTheDocument();
      expect(pnl).toHaveClass("text-slate-300");
    });
  });

  describe("active state", () => {
    it("applies the active border class when isActive is true", () => {
      const { container } = render(
        <PersonRowCard friend={makeFriend()} isActive={true} onClick={vi.fn()} />,
      );
      const innerDiv = container.querySelector("button > div");
      expect(innerDiv).toHaveClass("border-cyan-500/40");
    });

    it("does not apply the active border class when isActive is false", () => {
      const { container } = render(
        <PersonRowCard friend={makeFriend()} isActive={false} onClick={vi.fn()} />,
      );
      const innerDiv = container.querySelector("button > div");
      expect(innerDiv).not.toHaveClass("border-cyan-500/40");
    });
  });

  describe("interactions", () => {
    it("calls onClick when the card is clicked", () => {
      const onClick = vi.fn();
      render(<PersonRowCard friend={makeFriend()} isActive={false} onClick={onClick} />);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
