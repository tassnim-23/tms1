import { Injectable } from '@angular/core';

export interface PdfColumn { key: string; label: string; width?: number; }

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  async exportToPdf(
    data: any[], columns: PdfColumn[], filename: string, title: string
  ): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    this.drawHeader(doc, title, '');
    this.drawTable(doc, autoTable, data, columns, 26);
    this.addFooters(doc, autoTable);
    doc.save(`${filename}_${this.today()}.pdf`);
  }

  async exportRapportPdf(
    title: string, subtitle: string,
    stats: { label: string; value: string }[],
    data: any[], columns: PdfColumn[], filename: string
  ): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(27, 79, 114);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setFillColor(230, 126, 34);
    doc.rect(0, 28, pageW, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('TMS — GRPO Consulting', 10, 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(title, 10, 19);
    doc.setFontSize(8);
    doc.text(subtitle, 10, 25);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}`, pageW - 10, 25, { align: 'right' });

    // Stats cards
    let y = 34;
    if (stats.length > 0) {
      const boxW = (pageW - 20 - (stats.length - 1) * 4) / Math.min(stats.length, 6);
      stats.slice(0, 6).forEach((s, i) => {
        const x = 10 + i * (boxW + 4);
        doc.setFillColor(240, 246, 252);
        doc.roundedRect(x, y, boxW, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(27, 79, 114);
        doc.text(s.value, x + boxW / 2, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
        doc.text(s.label, x + boxW / 2, y + 12.5, { align: 'center' });
      });
      y += 18;
    }

    this.drawTable(doc, autoTable, data, columns, y);
    this.addFooters(doc, autoTable);
    doc.save(`${filename}_${this.today()}.pdf`);
  }

  private drawHeader(doc: any, title: string, subtitle: string): void {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(27, 79, 114); doc.rect(0, 0, pageW, 22, 'F');
    doc.setFillColor(230, 126, 34); doc.rect(0, 22, pageW, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('🚛 TMS — GRPO Consulting', 10, 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(title, 10, 17);
    doc.text(`${new Date().toLocaleDateString('fr-FR')}`, pageW - 10, 17, { align: 'right' });
  }

  private drawTable(doc: any, autoTable: any, data: any[], columns: PdfColumn[], startY: number): void {
    const head = [columns.map(c => c.label)];
    const body = data.map(row => columns.map(c => {
      const v = row[c.key]; return (v === null || v === undefined) ? '—' : String(v);
    }));
    const colStyles: any = {};
    columns.forEach((col, i) => { if (col.width) colStyles[i] = { cellWidth: col.width }; });
    autoTable(doc, {
      head, body, startY,
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [27, 79, 114], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 249, 253] },
      columnStyles: colStyles,
    });
  }

  private addFooters(doc: any, autoTable: any): void {
    const pageCount = doc.internal.getNumberOfPages();
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(27, 79, 114); doc.setLineWidth(0.3);
      doc.line(10, pageH - 10, pageW - 10, pageH - 10);
      doc.setFontSize(7); doc.setTextColor(130, 130, 130); doc.setFont('helvetica', 'normal');
      doc.text(`TMS GRPO Consulting © ${new Date().getFullYear()} — Confidentiel`, 10, pageH - 5);
      doc.text(`Page ${i} / ${pageCount}`, pageW - 10, pageH - 5, { align: 'right' });
    }
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
}
