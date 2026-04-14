import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadRideReceiptPdf } from "../../lib/rideReceipt";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("rideReceipt", () => {
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let appendChildSpy;
  let removeChildSpy;

  beforeEach(() => {
    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");

    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    appendChildSpy = vi.spyOn(document.body, "appendChild");
    removeChildSpy = vi.spyOn(document.body, "removeChild");

    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          rel: "",
          click: vi.fn(),
          remove: vi.fn(),
        };
      }
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when booking id is missing", async () => {
    await expect(downloadRideReceiptPdf("")).rejects.toThrow("Missing booking id");
  });

  it("downloads receipt pdf successfully", async () => {
    const blob = new Blob(["pdf-data"], { type: "application/pdf" });

    api.get.mockResolvedValue({
      status: 200,
      data: blob,
      headers: {
        "content-disposition": 'attachment; filename="receipt.pdf"',
      },
    });

    await expect(downloadRideReceiptPdf("abc123")).resolves.toBeUndefined();
    expect(api.get).toHaveBeenCalledWith("/api/bookings/abc123/receipt", {
      responseType: "blob",
      validateStatus: expect.any(Function),
    });
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it("throws backend error from json response", async () => {
    const errorBlob = new Blob(
      [JSON.stringify({ message: "Receipt download failed" })],
      { type: "application/json" }
    );

    api.get.mockResolvedValue({
      status: 400,
      data: errorBlob,
      headers: {},
    });

    await expect(downloadRideReceiptPdf("abc123")).rejects.toThrow(
      "Receipt download failed"
    );
  });
});