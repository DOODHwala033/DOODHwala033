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
});

export type AiTakeoverProps = z.infer<typeof aiTakeoverSchema>;

export const aiTakeoverDefaults: AiTakeoverProps = {
  dashboardRecording: "",
  recordButtonFocus: { x: 50, y: 50 },
  inboxRecording: "",
  inboxFocus: { x: 50, y: 40 },
  invoiceRecording: "",
  invoiceFocus: { x: 50, y: 40 },
  finalInvoiceCapture: "",
};
