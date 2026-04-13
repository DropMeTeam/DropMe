import { api } from "./api";

/**
 * Download ride receipt PDF using the same auth as API calls (Bearer / cookie).
 * Plain <a href> to the API omits Authorization and often omits partitioned cookies.
 */
export async function downloadRideReceiptPdf(bookingId) {
  const id = String(bookingId || "").trim();
  if (!id) throw new Error("Missing booking id");

  const res = await api.get(`/api/bookings/${id}/receipt`, {
    responseType: "blob",
    validateStatus: () => true,
  });

  const blob = res.data;
  if (!(blob instanceof Blob)) {
    throw new Error("Invalid receipt response");
  }

  if (res.status >= 400 || (blob.type && blob.type.includes("json"))) {
    const text = await blob.text();
    try {
      const j = JSON.parse(text);
      throw new Error(j.message || j.error || "Receipt download failed");
    } catch (e) {
      if (e instanceof Error && e.message && e.message !== text) throw e;
      throw new Error(text || `Receipt failed (${res.status})`);
    }
  }

  const dispo = res.headers["content-disposition"] || "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(dispo);
  const filename = (match && match[1] ? decodeURIComponent(match[1]) : null) || `dropme-receipt-${id}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
