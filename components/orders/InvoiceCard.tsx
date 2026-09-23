"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, FileImage, LoaderCircle, Printer } from "lucide-react";

interface InvoiceCardProps {
  invoice: {
    invoiceNumber: string;
    amount: number;
    status: string;
    issuedAt: string;
  };
  orderId: string;
  buyerState?: string | null;
  supplierState?: string | null;
}

export function InvoiceCard({ invoice, orderId, buyerState, supplierState }: InvoiceCardProps) {
  const taxRate = 18;
  const normalizedBuyerState = buyerState?.trim().toLowerCase();
  const normalizedSupplierState = supplierState?.trim().toLowerCase();
  const isIntraState = Boolean(normalizedBuyerState && normalizedSupplierState && normalizedBuyerState === normalizedSupplierState);
  const taxAmount = Math.round(invoice.amount * (taxRate / 100));
  const halfTaxAmount = Math.round(taxAmount / 2);
  const totalAmount = invoice.amount + taxAmount;
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);
  const [exportError, setExportError] = useState(false);

  async function exportInvoice(format: "pdf" | "png") {
    if (!invoiceRef.current) return;
    setExporting(format);
    setExportError(false);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const fileName = invoice.invoiceNumber.toLowerCase();

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, width, height);
        pdf.save(`${fileName}.pdf`);
      }
    } catch {
      setExportError(true);
    } finally {
      setExporting(null);
    }
  }

  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="invoice-print-area mt-5">
      <div
        ref={invoiceRef}
        style={{
          border: "1px solid #e9e8e4",
          borderRadius: 16,
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          padding: 20,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #e9e8e4", paddingBottom: 16 }}>
          <div>
            <div style={{ color: "#6b6b68", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>MTC Commerce</div>
            <h2 style={{ color: "#0a0a0a", fontSize: 16, fontWeight: 800, margin: "4px 0 0" }}>Tax invoice</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#0a0a0a", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{invoice.invoiceNumber}</div>
            <div style={{ color: "#6b6b68", fontSize: 11, marginTop: 4 }}>Issued {issuedDate}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12.5, marginTop: 16 }}>
          <div>
            <div style={{ color: "#6b6b68" }}>Order</div>
            <div style={{ color: "#0a0a0a", fontFamily: "monospace", fontWeight: 600, marginTop: 4 }}>#{orderId.slice(-8).toUpperCase()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#6b6b68" }}>Payment status</div>
            <div style={{ color: "#15803d", fontWeight: 600, marginTop: 4 }}>{invoice.status}</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #e9e8e4", marginTop: 20, paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5 }}>
            <span>Subtotal</span>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹{invoice.amount.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5, marginTop: 8 }}>
            <span>Discount</span>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹0</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5, marginTop: 8 }}>
            <span>Taxable Amount</span>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹{invoice.amount.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5, marginTop: 8 }}>
            <strong>CGST (9%)</strong>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹{(isIntraState ? halfTaxAmount : 0).toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5, marginTop: 8 }}>
            <strong>SGST (9%)</strong>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹{(isIntraState ? taxAmount - halfTaxAmount : 0).toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5, marginTop: 8 }}>
            <strong>IGST (18%)</strong>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹{(isIntraState ? 0 : taxAmount).toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b68", fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>
            <span>Total Tax (18%)</span>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace" }}>₹{taxAmount.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: "1px solid #e9e8e4", marginTop: 12, paddingTop: 12 }}>
            <span style={{ color: "#6b6b68", fontSize: 12.5, fontWeight: 700 }}>Grand Total</span>
            <span style={{ color: "#0a0a0a", fontFamily: "monospace", fontSize: 20, fontWeight: 800 }}>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-ink hover:border-ink"
          title="Print invoice or save it as a PDF"
        >
          <Printer size={14} /> Print
        </button>
        <button
          type="button"
          onClick={() => exportInvoice("pdf")}
          disabled={exporting !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-ink hover:border-ink disabled:opacity-50"
          title="Download invoice as PDF"
        >
          {exporting === "pdf" ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
          PDF
        </button>
        <button
          type="button"
          onClick={() => exportInvoice("png")}
          disabled={exporting !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-ink hover:border-ink disabled:opacity-50"
          title="Download invoice as image"
        >
          {exporting === "png" ? <LoaderCircle size={14} className="animate-spin" /> : <FileImage size={14} />}
          Image
        </button>
      </div>
      {exportError && <p className="mt-2 text-[12px] text-red-700">Could not create the file. Please try again or use Print.</p>}
    </section>
  );
}