import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PrivateAdminDashboard from "../../pages/private/PrivateAdminDashboard";

describe("PrivateAdminDashboard", () => {
  it("renders private admin heading", () => {
    render(
      <MemoryRouter>
        <PrivateAdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Private Vehicle Admin")).toBeInTheDocument();
  });

  it("renders Driver Approvals navigation", () => {
    render(
      <MemoryRouter>
        <PrivateAdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Driver Approvals")[0]).toBeInTheDocument();
  });

  it("renders admin controls card text", () => {
    render(
      <MemoryRouter>
        <PrivateAdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Controls")).toBeInTheDocument();
  });
});