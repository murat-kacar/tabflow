import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginForm } from "../components/login-form";

describe("LoginForm", () => {
  it("renders bootstrap guidance", () => {
    render(<LoginForm bootstrapRequired />);

    expect(screen.getByRole("heading", { name: "Super admin girisi" })).toBeInTheDocument();
    expect(screen.getByText(/henuz platform admin yok/i)).toBeInTheDocument();
  });
});
