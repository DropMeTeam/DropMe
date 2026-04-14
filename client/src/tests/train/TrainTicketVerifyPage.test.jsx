import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TrainTicketVerifyPage from "../../pages/train/TrainTicketVerifyPage";
import {
  verifyTrainTicketCode,
  markTrainTicketAsUsed,
} from "../../lib/trainAdminApi";

vi.mock("../../lib/trainAdminApi", () => ({
  verifyTrainTicketCode: vi.fn(),
  markTrainTicketAsUsed: vi.fn(),
}));

describe("TrainTicketVerifyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ticket verification heading", () => {
    render(<TrainTicketVerifyPage />);
    expect(screen.getByText("Ticket Verification")).toBeInTheDocument();
  });

  it("shows validation error when textarea is empty", async () => {
    render(<TrainTicketVerifyPage />);

    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    expect(
      screen.getByText("Enter or paste a ticket number, booking id, or QR payload.")
    ).toBeInTheDocument();
  });

  it("verifies a valid ticket and shows result", async () => {
    verifyTrainTicketCode.mockResolvedValue({
      verificationStatus: "valid",
      booking: {
        id: "bk1",
        ticketNo: "TRN-1001",
      },
    });

    render(<TrainTicketVerifyPage />);

    fireEvent.change(screen.getByPlaceholderText("TRN-… or booking id"), {
      target: { value: "TRN-1001" },
    });

    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(verifyTrainTicketCode).toHaveBeenCalledWith("TRN-1001");
    });

    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText("Ticket is Valid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as used/i })).toBeInTheDocument();
  });

  it("marks a valid ticket as used", async () => {
    verifyTrainTicketCode.mockResolvedValue({
      verificationStatus: "valid",
      booking: {
        id: "bk1",
        ticketNo: "TRN-1001",
      },
    });

    markTrainTicketAsUsed.mockResolvedValue({
      verificationStatus: "already_used",
      booking: {
        id: "bk1",
        ticketNo: "TRN-1001",
        ticketUsedAt: "2026-04-14T08:00:00.000Z",
        ticketUsedBy: "Inspector A",
      },
    });

    render(<TrainTicketVerifyPage />);

    fireEvent.change(screen.getByPlaceholderText("TRN-… or booking id"), {
      target: { value: "TRN-1001" },
    });

    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mark as used/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /mark as used/i }));

    await waitFor(() => {
      expect(markTrainTicketAsUsed).toHaveBeenCalledWith("bk1");
    });
  });
});