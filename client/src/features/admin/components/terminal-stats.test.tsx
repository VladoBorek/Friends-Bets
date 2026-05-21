// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TerminalStats } from "./terminal-stats";

describe("TerminalStats", () => {
  it("renders total, admin, and standard user counts", () => {
    render(<TerminalStats total={100} admins={15} standard={85} />);
    
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    
    expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Users/i)).toBeInTheDocument();
  });

  it("renders correctly with zero values", () => {
    render(<TerminalStats total={0} admins={0} standard={0} />);
    
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(3);
  });
});
