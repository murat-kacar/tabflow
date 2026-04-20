import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginForm } from "../components/login-form";
import { en } from "../i18n/dictionaries/en";

describe("LoginForm", () => {
  it("renders bootstrap guidance", () => {
    render(<LoginForm bootstrapRequired t={en} />);

    expect(screen.getByRole("heading", { name: "Super admin login" })).toBeInTheDocument();
    expect(screen.getByText(/no platform admin exists yet/i)).toBeInTheDocument();
  });
});
