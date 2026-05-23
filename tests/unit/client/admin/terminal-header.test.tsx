// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TerminalHeader } from "@client/features/admin/components/terminal-header";

describe("TerminalHeader", () => {
  it("renders all tabs", () => {
    render(<TerminalHeader activeTab="users" onTabChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Users/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Groups/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Categories/i })).toBeInTheDocument();
  });

  it("calls onTabChange when a tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<TerminalHeader activeTab="users" onTabChange={onTabChange} />);
    
    fireEvent.click(screen.getByRole("button", { name: /Groups/i }));
    expect(onTabChange).toHaveBeenCalledWith("groups");
    
    fireEvent.click(screen.getByRole("button", { name: /Categories/i }));
    expect(onTabChange).toHaveBeenCalledWith("categories");
  });

  it("applies active styles to the current tab", () => {
    const { rerender } = render(<TerminalHeader activeTab="users" onTabChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Users/i })).toHaveClass("bg-cyan-500");
    
    rerender(<TerminalHeader activeTab="groups" onTabChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Groups/i })).toHaveClass("bg-cyan-500");
    expect(screen.getByRole("button", { name: /Users/i })).not.toHaveClass("bg-cyan-500");
  });

  it("renders the header title and description", () => {
    render(<TerminalHeader activeTab="users" onTabChange={vi.fn()} />);
    expect(screen.getByText(/Terminal/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage users, review system activity/i)).toBeInTheDocument();
  });
});
