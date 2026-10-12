import { z } from "zod";

// Each recording is a path inside public/ (e.g. "recordings/dashboard.mp4")
// or a full URL. Leave it empty to show a placeholder slate instead.
// Focus points are percentages of the frame: where the punch-in zooms to.
const focusPoint = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const aiTakeoverSchema = z.object({
  dashboardRecording: z.string(),
  recordButtonFocus: focusPoint,
  inboxRecording: z.string(),
  inboxFocus: focusPoint,
  invoiceRecording: z.string(),
  invoiceFocus: focusPoint,
  finalInvoiceCapture: z.string(),
  finalInvoiceFocus: focusPoint,
});

export type AiTakeoverProps = z.infer<typeof aiTakeoverSchema>;

export const aiTakeoverDefaults: AiTakeoverProps = {
  dashboardRecording: "recordings/receipts.jpg",
  recordButtonFocus: { x: 70, y: 8 },
  inboxRecording: "recordings/letters.webp",
  inboxFocus: { x: 45, y: 55 },
  invoiceRecording: "recordings/tax-invoice.jpg",
  invoiceFocus: { x: 30, y: 12 },
  finalInvoiceCapture: "recordings/tax-invoice.jpg",
  finalInvoiceFocus: { x: 92, y: 76 },
};
