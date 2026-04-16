import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as customerSession from "./lib/customer-session";
import TenantHome from "./page";

vi.mock("./lib/customer-session", () => ({
  getCustomerSession: vi.fn()
}));

describe("TenantHome", () => {
  beforeEach(() => {
    vi.mocked(customerSession.getCustomerSession).mockResolvedValue(null);
  });

  it("renders the tenant landing page", async () => {
    render(await TenantHome());

    expect(
      screen.getByRole("heading", { name: /masa tabanli siparis girisi hazir/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/qr ile baslar/i)).toBeInTheDocument();
  });
});
